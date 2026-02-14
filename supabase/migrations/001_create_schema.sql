-- Migration 001: Base Schema for PORTA Smart Logistics
-- Created: 2026-02-14
-- Purpose: Core tables, functions, and seed data for hackathon

-- ============================================================
-- 1. Core Tables
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  authorized_priorities TEXT[] DEFAULT ARRAY['NORMAL', 'LOW'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drivers
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle_plate TEXT NOT NULL,
  vehicle_type TEXT DEFAULT 'TRUCK',
  has_smartphone BOOLEAN DEFAULT true,
  prefers_sms BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  container_number TEXT,
  container_count INTEGER DEFAULT 1,
  cargo_type TEXT NOT NULL,
  priority TEXT NOT NULL,
  pickup_location TEXT NOT NULL,
  destination TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TIME NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'PENDING',
  assigned_driver_id UUID REFERENCES drivers(id),
  permit_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time Slots
CREATE TABLE time_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INTEGER DEFAULT 10,
  booked INTEGER DEFAULT 0,
  status TEXT DEFAULT 'AVAILABLE',
  predicted_traffic TEXT DEFAULT 'NORMAL',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, start_time)
);

-- Permits
CREATE TABLE permits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES time_slots(id),
  job_id UUID REFERENCES jobs(id),
  permit_code TEXT NOT NULL UNIQUE,
  qr_code TEXT NOT NULL UNIQUE,
  priority TEXT NOT NULL,
  cargo_type TEXT NOT NULL,
  status TEXT DEFAULT 'APPROVED',
  delivery_method TEXT DEFAULT 'APP',
  vessel_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vessel Schedules
CREATE TABLE vessel_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vessel_name TEXT NOT NULL,
  arrival_date DATE NOT NULL,
  arrival_time TIME NOT NULL,
  estimated_trucks INTEGER DEFAULT 0,
  cargo_priority TEXT DEFAULT 'NORMAL',
  status TEXT DEFAULT 'SCHEDULED',
  source TEXT DEFAULT 'MANUAL',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Priority Rules
CREATE TABLE priority_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cargo_type TEXT NOT NULL UNIQUE,
  priority_level TEXT NOT NULL,
  max_delay_minutes INTEGER NOT NULL,
  can_be_halted BOOLEAN DEFAULT false,
  color_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Traffic Updates
CREATE TABLE traffic_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  camera_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL,
  vehicle_count INTEGER DEFAULT 0,
  truck_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES drivers(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  delivery_method TEXT DEFAULT 'APP',
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Driver Locations
CREATE TABLE driver_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. Indexes
-- ============================================================
CREATE INDEX idx_drivers_org ON drivers(organization_id);
CREATE INDEX idx_jobs_org ON jobs(organization_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_permits_driver ON permits(driver_id);
CREATE INDEX idx_permits_status ON permits(status);
CREATE INDEX idx_time_slots_date ON time_slots(date);
CREATE INDEX idx_vessels_date ON vessel_schedules(arrival_date);
CREATE INDEX idx_traffic_timestamp ON traffic_updates(timestamp);

-- ============================================================
-- 3. Functions
-- ============================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generate permit code
CREATE OR REPLACE FUNCTION generate_permit_code()
RETURNS TEXT AS $$
DECLARE
  permit_code TEXT;
BEGIN
  permit_code := 'P-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN permit_code;
END;
$$ LANGUAGE plpgsql;

-- Get priority from cargo type
CREATE OR REPLACE FUNCTION get_priority_from_cargo(cargo_type TEXT)
RETURNS TEXT AS $$
DECLARE
  priority TEXT;
BEGIN
  SELECT priority_level INTO priority
  FROM priority_rules
  WHERE priority_rules.cargo_type = get_priority_from_cargo.cargo_type;

  IF priority IS NULL THEN
    RETURN 'NORMAL';
  END IF;

  RETURN priority;
END;
$$ LANGUAGE plpgsql;

-- Find best available time slot
CREATE OR REPLACE FUNCTION find_best_slot(
  p_preferred_date DATE,
  p_preferred_time TIME,
  p_priority TEXT
)
RETURNS UUID AS $$
DECLARE
  slot_id UUID;
BEGIN
  -- Try to find slot on preferred date and time
  SELECT id INTO slot_id
  FROM time_slots
  WHERE date = p_preferred_date
    AND start_time = p_preferred_time
    AND status = 'AVAILABLE'
    AND booked < capacity
  LIMIT 1;

  IF slot_id IS NOT NULL THEN
    RETURN slot_id;
  END IF;

  -- Try any available slot on preferred date
  SELECT id INTO slot_id
  FROM time_slots
  WHERE date = p_preferred_date
    AND status = 'AVAILABLE'
    AND booked < capacity
  ORDER BY
    CASE WHEN predicted_traffic = 'NORMAL' THEN 1
         WHEN predicted_traffic = 'MODERATE' THEN 2
         ELSE 3 END,
    ABS(EXTRACT(EPOCH FROM (start_time - p_preferred_time)))
  LIMIT 1;

  IF slot_id IS NOT NULL THEN
    RETURN slot_id;
  END IF;

  -- Try next available slot within 7 days
  SELECT id INTO slot_id
  FROM time_slots
  WHERE date >= p_preferred_date
    AND date <= p_preferred_date + INTERVAL '7 days'
    AND status = 'AVAILABLE'
    AND booked < capacity
  ORDER BY date, start_time
  LIMIT 1;

  RETURN slot_id;
END;
$$ LANGUAGE plpgsql;

-- Halt permits by priority during congestion
CREATE OR REPLACE FUNCTION halt_permits_by_priority(traffic_status TEXT)
RETURNS TABLE(affected_count BIGINT, protected_count BIGINT) AS $$
DECLARE
  affected BIGINT;
  protected BIGINT;
BEGIN
  IF traffic_status = 'CONGESTED' THEN
    -- Halt NORMAL and LOW priority permits
    UPDATE permits
    SET status = 'HALTED'
    WHERE priority IN ('NORMAL', 'LOW')
      AND status = 'APPROVED';

    GET DIAGNOSTICS affected = ROW_COUNT;

    -- Count protected permits
    SELECT COUNT(*) INTO protected
    FROM permits
    WHERE priority IN ('EMERGENCY', 'ESSENTIAL')
      AND status = 'APPROVED';

    RETURN QUERY SELECT affected, protected;
  ELSE
    RETURN QUERY SELECT 0::BIGINT, 0::BIGINT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 4. Triggers
-- ============================================================
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_slots_updated_at
  BEFORE UPDATE ON time_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permits_updated_at
  BEFORE UPDATE ON permits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. Seed Data
-- ============================================================

-- Priority Rules
INSERT INTO priority_rules (cargo_type, priority_level, max_delay_minutes, can_be_halted, color_code)
VALUES
  ('PERISHABLE', 'EMERGENCY', 0, false, '#EF4444'),
  ('MEDICAL', 'EMERGENCY', 0, false, '#DC2626'),
  ('TIME_SENSITIVE', 'ESSENTIAL', 120, false, '#F59E0B'),
  ('STANDARD', 'NORMAL', 480, true, '#3B82F6'),
  ('BULK', 'LOW', 1440, true, '#6B7280');

-- Demo Organization (SMSA)
INSERT INTO organizations (name, email, phone, password_hash, authorized_priorities)
VALUES (
  'SMSA',
  'smsa@porta.sa',
  '+966501234567',
  '$2a$10$rH3qKZ7YVZ.vH8KZ8Z8Z8OqZ8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8',  -- password: smsa123
  ARRAY['EMERGENCY', 'ESSENTIAL', 'NORMAL', 'LOW']
);

-- Demo Drivers for SMSA
DO $$
DECLARE
  smsa_org_id UUID;
BEGIN
  SELECT id INTO smsa_org_id FROM organizations WHERE email = 'smsa@porta.sa';

  INSERT INTO drivers (organization_id, name, phone, vehicle_plate, vehicle_type, is_available)
  VALUES
    (smsa_org_id, 'Ahmed Al-Khalid', '+966501111111', 'ABC-1234', 'TRUCK', true),
    (smsa_org_id, 'Mohammed Al-Rashid', '+966502222222', 'DEF-5678', 'TRUCK', true),
    (smsa_org_id, 'Khalid Al-Saud', '+966503333333', 'GHI-9012', 'CONTAINER', true),
    (smsa_org_id, 'Abdullah Al-Nasser', '+966504444444', 'JKL-3456', 'TRUCK', true),
    (smsa_org_id, 'Fahad Al-Mutairi', '+966505555555', 'MNO-7890', 'CONTAINER', true);
END;
$$;

-- Time Slots for next 7 days (24/7 operation)
DO $$
DECLARE
  current_date DATE := CURRENT_DATE;
  slot_date DATE;
  slot_hour INTEGER;
  slot_start TIME;
  slot_end TIME;
BEGIN
  FOR day_offset IN 0..6 LOOP
    slot_date := current_date + day_offset;

    FOR slot_hour IN 0..23 LOOP
      slot_start := (slot_hour || ':00')::TIME;
      slot_end := ((slot_hour + 2) % 24 || ':00')::TIME;

      INSERT INTO time_slots (date, start_time, end_time, capacity, booked, status, predicted_traffic)
      VALUES (
        slot_date,
        slot_start,
        slot_end,
        CASE
          WHEN slot_hour >= 8 AND slot_hour < 14 THEN 5  -- Reduced capacity during peak
          ELSE 10
        END,
        0,
        'AVAILABLE',
        CASE
          WHEN slot_hour >= 8 AND slot_hour < 14 THEN 'MODERATE'
          WHEN slot_hour >= 22 OR slot_hour < 6 THEN 'NORMAL'
          ELSE 'NORMAL'
        END
      );
    END LOOP;
  END LOOP;
END;
$$;

-- Demo Vessels
INSERT INTO vessel_schedules (vessel_name, arrival_date, arrival_time, estimated_trucks, cargo_priority, status)
VALUES
  ('MV SAUDI CARRIER', CURRENT_DATE + INTERVAL '1 day', '08:00', 320, 'NORMAL', 'SCHEDULED'),
  ('MV GULF STAR', CURRENT_DATE + INTERVAL '1 day', '09:30', 240, 'NORMAL', 'SCHEDULED'),
  ('MV RED SEA EXPRESS', CURRENT_DATE + INTERVAL '2 days', '07:00', 280, 'ESSENTIAL', 'SCHEDULED');

-- ============================================================
-- 6. Row Level Security (Optional for hackathon)
-- ============================================================
-- RLS can be enabled later for production

COMMENT ON TABLE organizations IS 'Logistics companies using PORTA system';
COMMENT ON TABLE drivers IS 'Drivers registered to organizations';
COMMENT ON TABLE jobs IS 'Delivery jobs created by organizations';
COMMENT ON TABLE permits IS 'Auto-generated permits when jobs are assigned';
COMMENT ON TABLE time_slots IS '24/7 time slots for truck scheduling';
COMMENT ON TABLE vessel_schedules IS 'Ship arrivals driving congestion prediction';
