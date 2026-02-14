-- Migration 003: Add Organization Context to Permits
-- Created: 2026-02-14
-- Purpose: Link permits to organizations so admin can see which org created which permit

-- ============================================================
-- 1. Add organization_id to permits table
-- ============================================================
ALTER TABLE permits
ADD COLUMN organization_id UUID REFERENCES organizations(id);

-- ============================================================
-- 2. Backfill existing permits with organization_id
-- ============================================================
-- Link permits to organizations via driver → organization relationship
UPDATE permits
SET organization_id = (
  SELECT d.organization_id
  FROM drivers d
  WHERE d.id = permits.driver_id
);

-- ============================================================
-- 3. Create indexes for fast filtering
-- ============================================================
CREATE INDEX idx_permits_organization_id ON permits(organization_id);
CREATE INDEX idx_permits_org_status ON permits(organization_id, status);
CREATE INDEX idx_permits_org_date ON permits(organization_id, created_at DESC);

-- ============================================================
-- 4. Add comments for documentation
-- ============================================================
COMMENT ON COLUMN permits.organization_id IS 'Organization that created this permit (via job assignment)';

-- ============================================================
-- 5. Update RLS policies to include organization context
-- ============================================================

-- Allow organizations to see their own permits
CREATE POLICY permits_org_access ON permits
  FOR SELECT
  USING (
    organization_id = current_setting('app.current_organization_id', true)::uuid
  );

-- Note: Service role still has full access via existing service_role policy
