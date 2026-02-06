-- Test Data for API Endpoint Testing
-- Run this in Supabase SQL Editor

-- 1. Create test driver
INSERT INTO drivers (id, phone, name, vehicle_plate, vehicle_type, company, verified, is_active)
VALUES
  ('123e4567-e89b-12d3-a456-426614174000', '+966501234567', 'Ahmed Al-Rashid', 'DM-1234', 'TRUCK', 'Fast Logistics Co.', true, true)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      vehicle_plate = EXCLUDED.vehicle_plate;

-- 2. Verify time slots exist (should already be there from schema seed)
SELECT COUNT(*) AS slot_count FROM time_slots WHERE date >= CURRENT_DATE;

-- 3. Get a sample slot ID for testing
SELECT id, date, start_time, end_time, capacity, booked, status
FROM time_slots
WHERE date >= CURRENT_DATE
  AND status = 'AVAILABLE'
ORDER BY date, start_time
LIMIT 5;

-- 4. Check priority rules
SELECT cargo_type, priority_level, color_code FROM priority_rules;

-- Expected output:
-- ✓ Driver created with ID: 123e4567-e89b-12d3-a456-426614174000
-- ✓ Multiple available slots for today/tomorrow
-- ✓ 10 priority rules with colors
