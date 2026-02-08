-- Test Data for API Endpoint Testing
-- Run this in Supabase SQL Editor

-- 1. Create test drivers with realistic Saudi commercial truck plates
INSERT INTO drivers (id, phone, name, vehicle_plate, vehicle_type, company, verified, is_active)
VALUES
  ('123e4567-e89b-12d3-a456-426614174000', '+966501234567', 'Ahmed Al-Rashid', '7653 TNJ', 'TRUCK', 'Fast Logistics Co.', true, true),
  ('223e4567-e89b-12d3-a456-426614174001', '+966502345678', 'Mohammed Al-Qahtani', '8421 KSA', 'TRUCK', 'Saudi Transport Ltd.', true, true),
  ('323e4567-e89b-12d3-a456-426614174002', '+966503456789', 'Khalid Al-Dosari', '5932 DMM', 'TRUCK', 'Dammam Freight Services', true, true),
  ('423e4567-e89b-12d3-a456-426614174003', '+966504567890', 'Abdullah Al-Mutairi', '2847 RYD', 'TRUCK', 'Riyadh Cargo Co.', true, true),
  ('523e4567-e89b-12d3-a456-426614174004', '+966505678901', 'Saud Al-Harbi', '6194 JED', 'TRUCK', 'Express Logistics', true, true)
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

-- 5. Add traffic data for testing (simulates AI camera feed)
INSERT INTO traffic_updates (camera_id, timestamp, status, vehicle_count, truck_count, recommendation)
VALUES
  ('CAM_01_KING_ABDULAZIZ', NOW() - INTERVAL '5 minutes', 'NORMAL', 45, 8, 'APPROVE_ALL_PERMITS'),
  ('CAM_01_KING_ABDULAZIZ', NOW() - INTERVAL '10 minutes', 'NORMAL', 52, 12, 'APPROVE_ALL_PERMITS'),
  ('CAM_01_KING_ABDULAZIZ', NOW() - INTERVAL '15 minutes', 'MODERATE', 105, 18, 'WARN_DRIVERS'),
  ('CAM_01_KING_ABDULAZIZ', NOW() - INTERVAL '20 minutes', 'NORMAL', 67, 14, 'APPROVE_ALL_PERMITS'),
  ('CAM_01_KING_ABDULAZIZ', NOW() - INTERVAL '25 minutes', 'NORMAL', 72, 11, 'APPROVE_ALL_PERMITS'),
  ('CAM_01_KING_ABDULAZIZ', NOW() - INTERVAL '30 minutes', 'MODERATE', 112, 22, 'WARN_DRIVERS')
ON CONFLICT DO NOTHING;

-- Expected output:
-- ✓ 5 Drivers created with realistic Saudi plates (7653 TNJ, 8421 KSA, etc.)
-- ✓ Multiple available slots for today/tomorrow
-- ✓ 10 priority rules with colors
-- ✓ Traffic data seeded for dashboard display
