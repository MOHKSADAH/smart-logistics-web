-- Migration 004: Job Templates
-- Created: 2026-02-14
-- Purpose: Allow organizations to save job configurations as reusable templates

-- ============================================================
-- 1. Job Templates Table
-- ============================================================
CREATE TABLE job_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  cargo_type TEXT NOT NULL,
  priority TEXT NOT NULL,
  pickup_location TEXT NOT NULL,
  destination TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_templates_org ON job_templates(organization_id);
CREATE INDEX idx_job_templates_org_name ON job_templates(organization_id, template_name);

COMMENT ON TABLE job_templates IS 'Reusable job templates for organizations to speed up job creation';
COMMENT ON COLUMN job_templates.template_name IS 'User-friendly name like "Medical Run to Riyadh"';

-- ============================================================
-- 2. Triggers
-- ============================================================
CREATE TRIGGER update_job_templates_updated_at
  BEFORE UPDATE ON job_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 3. Row Level Security (RLS)
-- ============================================================
ALTER TABLE job_templates ENABLE ROW LEVEL SECURITY;

-- Organizations can only manage their own templates
CREATE POLICY job_templates_org_access ON job_templates
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid)
  WITH CHECK (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- Service role has full access
CREATE POLICY job_templates_service_role ON job_templates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 4. Seed Data: Demo Templates
-- ============================================================
DO $$
DECLARE
  smsa_org_id UUID;
BEGIN
  -- Find SMSA organization
  SELECT id INTO smsa_org_id
  FROM organizations
  WHERE name = 'SMSA' OR email LIKE '%smsa%'
  LIMIT 1;

  -- Insert demo templates if SMSA exists
  IF smsa_org_id IS NOT NULL THEN
    INSERT INTO job_templates (organization_id, template_name, cargo_type, priority, pickup_location, destination, notes)
    VALUES
      (smsa_org_id, 'Medical Run to Riyadh', 'MEDICAL', 'EMERGENCY', 'Dammam Port', 'Riyadh', 'Urgent medical supplies delivery'),
      (smsa_org_id, 'Standard Container Pickup', 'STANDARD', 'NORMAL', 'Dammam Port', 'Khobar', 'Regular container pickup'),
      (smsa_org_id, 'Perishable Goods Express', 'PERISHABLE', 'EMERGENCY', 'Dammam Port', 'Jeddah', 'Fresh produce - maintain cold chain')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Created demo job templates for SMSA organization';
  END IF;
END;
$$;
