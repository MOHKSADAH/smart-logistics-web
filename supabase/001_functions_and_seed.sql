-- Functions and Seed Data Only (tables already exist)
-- Run this if you already have the base tables

-- ============================================================
-- 1. Functions
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
DROP FUNCTION IF EXISTS find_best_slot(DATE, TIME, TEXT);

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
DROP FUNCTION IF EXISTS halt_permits_by_priority(TEXT);

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
-- 2. Seed Data
-- ============================================================

-- Priority Rules (insert if not exists)
INSERT INTO priority_rules (cargo_type, priority_level, max_delay_minutes, can_be_halted, color_code)
VALUES
  ('PERISHABLE', 'EMERGENCY', 0, false, '#EF4444'),
  ('MEDICAL', 'EMERGENCY', 0, false, '#DC2626'),
  ('TIME_SENSITIVE', 'ESSENTIAL', 120, false, '#F59E0B'),
  ('STANDARD', 'NORMAL', 480, true, '#3B82F6'),
  ('BULK', 'LOW', 1440, true, '#6B7280')
ON CONFLICT (cargo_type) DO NOTHING;

-- Demo Organization (SMSA) - insert if not exists
INSERT INTO organizations (name, email, phone, password_hash, authorized_priorities)
VALUES (
  'SMSA',
  'smsa@porta.sa',
  '+966501234567',
  'demo_password_hash',
  ARRAY['EMERGENCY', 'ESSENTIAL', 'NORMAL', 'LOW']
)
ON CONFLICT (email) DO NOTHING;

-- Demo Drivers for SMSA
DO $$
DECLARE
  smsa_org_id UUID;
  driver_count INTEGER;
BEGIN
  SELECT id INTO smsa_org_id FROM organizations WHERE email = 'smsa@porta.sa';

  IF smsa_org_id IS NOT NULL THEN
    -- Check if drivers already exist
    SELECT COUNT(*) INTO driver_count FROM drivers WHERE organization_id = smsa_org_id;

    IF driver_count = 0 THEN
      INSERT INTO drivers (organization_id, name, phone, vehicle_plate, vehicle_type, is_available)
      VALUES
        (smsa_org_id, 'Ahmed Al-Khalid', '+966501111111', 'ABC-1234', 'TRUCK', true),
        (smsa_org_id, 'Mohammed Al-Rashid', '+966502222222', 'DEF-5678', 'TRUCK', true),
        (smsa_org_id, 'Khalid Al-Saud', '+966503333333', 'GHI-9012', 'CONTAINER', true),
        (smsa_org_id, 'Abdullah Al-Nasser', '+966504444444', 'JKL-3456', 'TRUCK', true),
        (smsa_org_id, 'Fahad Al-Mutairi', '+966505555555', 'MNO-7890', 'CONTAINER', true);

      RAISE NOTICE 'Created 5 demo drivers for SMSA';
    END IF;
  END IF;
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
  existing_slots INTEGER;
BEGIN
  -- Check if slots already exist
  SELECT COUNT(*) INTO existing_slots
  FROM time_slots
  WHERE date >= current_date;

  IF existing_slots = 0 THEN
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
            WHEN slot_hour >= 8 AND slot_hour < 14 THEN 5
            ELSE 10
          END,
          0,
          'AVAILABLE',
          CASE
            WHEN slot_hour >= 8 AND slot_hour < 14 THEN 'MODERATE'
            ELSE 'NORMAL'
          END
        )
        ON CONFLICT (date, start_time) DO NOTHING;
      END LOOP;
    END LOOP;

    RAISE NOTICE 'Created time slots for next 7 days';
  END IF;
END;
$$;

-- Demo Vessels
INSERT INTO vessel_schedules (vessel_name, arrival_date, arrival_time, estimated_trucks, cargo_priority, status)
VALUES
  ('MV SAUDI CARRIER', CURRENT_DATE + INTERVAL '1 day', '08:00', 320, 'NORMAL', 'SCHEDULED'),
  ('MV GULF STAR', CURRENT_DATE + INTERVAL '1 day', '09:30', 240, 'NORMAL', 'SCHEDULED'),
  ('MV RED SEA EXPRESS', CURRENT_DATE + INTERVAL '2 days', '07:00', 280, 'ESSENTIAL', 'SCHEDULED')
ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Functions and seed data added successfully!';
  RAISE NOTICE '📧 Demo Login: smsa@porta.sa';
  RAISE NOTICE '👥 5 drivers created and available';
  RAISE NOTICE '📅 7 days of time slots created (168 total)';
  RAISE NOTICE '🚢 3 demo vessels scheduled';
END;
$$;
