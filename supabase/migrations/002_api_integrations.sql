-- Migration 002: API Integration Architecture
-- Created: 2026-02-14
-- Purpose: Enable API-driven vessel data from Mawani port + organization APIs

-- ============================================================
-- 1. API Integrations Table
-- Store organization API configurations and sync status
-- ============================================================
CREATE TABLE api_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  api_type TEXT NOT NULL CHECK (api_type IN ('VESSEL_TRACKING', 'SHIPMENT_DATA', 'CONTAINER_STATUS')),
  api_endpoint TEXT NOT NULL, -- Organization's API URL
  api_key TEXT, -- Encrypted API key for authentication
  webhook_secret TEXT, -- For validating webhooks from organization
  is_active BOOLEAN DEFAULT true,
  sync_frequency_minutes INT DEFAULT 60, -- Poll every 60 minutes
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT CHECK (last_sync_status IN ('SUCCESS', 'FAILED', 'PENDING')),
  last_sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, api_type)
);

CREATE INDEX idx_api_integrations_org ON api_integrations(organization_id);
CREATE INDEX idx_api_integrations_active ON api_integrations(is_active, last_sync_at);

COMMENT ON TABLE api_integrations IS 'Organization API configurations for vessel tracking and shipment data';
COMMENT ON COLUMN api_integrations.api_type IS 'Type of data provided by this API integration';
COMMENT ON COLUMN api_integrations.sync_frequency_minutes IS 'How often to poll this API (minutes)';

-- ============================================================
-- 2. Organization Vessel Tracking Table
-- Store organization-specific vessel data synced from their APIs
-- ============================================================
CREATE TABLE organization_vessel_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vessel_name TEXT NOT NULL,
  vessel_id TEXT, -- Organization's internal vessel ID
  arrival_date DATE NOT NULL,
  arrival_time TIME,
  estimated_containers INT DEFAULT 0,
  estimated_trucks INT DEFAULT 0,
  shipment_numbers TEXT[], -- Array of shipment/booking numbers
  container_numbers TEXT[], -- Array of container IDs
  cargo_types TEXT[], -- Array of cargo types on this vessel
  priority_breakdown JSONB, -- {EMERGENCY: 5, ESSENTIAL: 10, NORMAL: 30}
  source TEXT DEFAULT 'API' CHECK (source IN ('API', 'MANUAL')),
  api_integration_id UUID REFERENCES api_integrations(id),
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_org_vessel_tracking_org ON organization_vessel_tracking(organization_id);
CREATE INDEX idx_org_vessel_tracking_date ON organization_vessel_tracking(arrival_date);
CREATE INDEX idx_org_vessel_tracking_org_date ON organization_vessel_tracking(organization_id, arrival_date);

COMMENT ON TABLE organization_vessel_tracking IS 'Organization-specific vessel tracking data from their APIs';
COMMENT ON COLUMN organization_vessel_tracking.shipment_numbers IS 'Organization shipment/booking reference numbers';
COMMENT ON COLUMN organization_vessel_tracking.priority_breakdown IS 'JSON object with priority counts: {EMERGENCY: 5, ESSENTIAL: 10}';

-- ============================================================
-- 3. API Sync Logs Table
-- Track API sync execution history for monitoring and debugging
-- ============================================================
CREATE TABLE api_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_integration_id UUID REFERENCES api_integrations(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('POLL', 'WEBHOOK', 'MANUAL')),
  status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'PARTIAL')),
  records_synced INT DEFAULT 0,
  errors JSONB, -- Array of error messages
  duration_ms INT, -- How long the sync took
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_sync_logs_integration ON api_sync_logs(api_integration_id, created_at DESC);
CREATE INDEX idx_api_sync_logs_status ON api_sync_logs(status, created_at DESC);

COMMENT ON TABLE api_sync_logs IS 'Execution history of API sync operations';
COMMENT ON COLUMN api_sync_logs.sync_type IS 'How the sync was triggered: polling, webhook, or manual';
COMMENT ON COLUMN api_sync_logs.errors IS 'JSON array of error messages if sync failed';

-- ============================================================
-- 4. Update Vessel Schedules Table
-- Add columns to distinguish source and track external IDs
-- ============================================================
ALTER TABLE vessel_schedules
ADD COLUMN source TEXT DEFAULT 'MANUAL' CHECK (source IN ('MANUAL', 'MAWANI_API', 'ORGANIZATION_API')),
ADD COLUMN synced_at TIMESTAMPTZ,
ADD COLUMN external_vessel_id TEXT; -- Mawani's vessel ID or org's vessel ID

CREATE INDEX idx_vessel_schedules_source ON vessel_schedules(source);

COMMENT ON COLUMN vessel_schedules.source IS 'Where vessel data came from: manual entry, Mawani API, or organization API';
COMMENT ON COLUMN vessel_schedules.external_vessel_id IS 'External system vessel identifier for correlation';

-- ============================================================
-- 5. Triggers for updated_at timestamps
-- ============================================================
CREATE TRIGGER update_api_integrations_updated_at
  BEFORE UPDATE ON api_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_vessel_tracking_updated_at
  BEFORE UPDATE ON organization_vessel_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. Row Level Security (RLS) Policies
-- ============================================================

-- API Integrations: Organizations can only manage their own
ALTER TABLE api_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY api_integrations_org_access ON api_integrations
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- Organization Vessel Tracking: Organizations can only see their own
ALTER TABLE organization_vessel_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_vessel_tracking_org_access ON organization_vessel_tracking
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- API Sync Logs: Organizations can only see logs for their integrations
ALTER TABLE api_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY api_sync_logs_org_access ON api_sync_logs
  FOR SELECT
  USING (
    api_integration_id IN (
      SELECT id FROM api_integrations
      WHERE organization_id = current_setting('app.current_organization_id', true)::uuid
    )
  );

-- Service role can access all tables (for admin and sync operations)
CREATE POLICY api_integrations_service_role ON api_integrations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY org_vessel_tracking_service_role ON organization_vessel_tracking
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY api_sync_logs_service_role ON api_sync_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 7. Helper Function: Get Organization's Next Sync Time
-- ============================================================
CREATE OR REPLACE FUNCTION get_next_sync_time(integration_id UUID)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
AS $$
DECLARE
  last_sync TIMESTAMPTZ;
  frequency INT;
BEGIN
  SELECT last_sync_at, sync_frequency_minutes
  INTO last_sync, frequency
  FROM api_integrations
  WHERE id = integration_id;

  IF last_sync IS NULL THEN
    RETURN NOW();
  ELSE
    RETURN last_sync + (frequency || ' minutes')::INTERVAL;
  END IF;
END;
$$;

COMMENT ON FUNCTION get_next_sync_time IS 'Calculate when the next sync should run for an API integration';

-- ============================================================
-- 8. Seed Data: Demo API Integration for Testing
-- ============================================================

-- Create a demo API integration for SMSA organization (if exists)
-- This is for development/demo purposes only
DO $$
DECLARE
  smsa_org_id UUID;
BEGIN
  -- Find SMSA organization
  SELECT id INTO smsa_org_id
  FROM organizations
  WHERE name = 'SMSA' OR email LIKE '%smsa%'
  LIMIT 1;

  -- Insert demo API integration if SMSA exists
  IF smsa_org_id IS NOT NULL THEN
    INSERT INTO api_integrations (
      organization_id,
      api_type,
      api_endpoint,
      api_key,
      webhook_secret,
      is_active,
      sync_frequency_minutes,
      last_sync_status
    ) VALUES (
      smsa_org_id,
      'VESSEL_TRACKING',
      'https://api-demo.smsa.com/vessels',
      'demo_api_key_12345',
      'demo_webhook_secret_67890',
      true,
      60,
      'SUCCESS'
    )
    ON CONFLICT (organization_id, api_type) DO NOTHING;

    RAISE NOTICE 'Created demo API integration for SMSA organization';
  END IF;
END;
$$;
