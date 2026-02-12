-- QUICK FIX: Create time slots for testing
-- Run this in Supabase SQL Editor if you haven't run migration 007

-- Delete existing slots (if any)
DELETE FROM time_slots;

-- Create time slots for next 7 days (12 slots per day = 84 total)
INSERT INTO time_slots (date, start_time, end_time, capacity, predicted_traffic, status)
SELECT
  d::DATE as date,
  (DATE '2000-01-01' + (h || ' hours')::INTERVAL)::TIME as start_time,
  (DATE '2000-01-01' + ((h + 2) || ' hours')::INTERVAL)::TIME as end_time,
  CASE
    WHEN h BETWEEN 8 AND 12 THEN 50   -- Peak: 8am-2pm (vessel surge)
    WHEN h >= 22 OR h < 6 THEN 200    -- Night: 10pm-6am (incentivized)
    ELSE 100                           -- Off-peak: 6am-8am, 2pm-10pm
  END as capacity,
  CASE
    WHEN h BETWEEN 8 AND 12 THEN 'MODERATE'
    ELSE 'NORMAL'
  END as predicted_traffic,
  'AVAILABLE' as status
FROM generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', '1 day'::INTERVAL) d
CROSS JOIN generate_series(0, 22, 2) h;

-- Verify slots created
SELECT
  COUNT(*) as total_slots,
  MIN(date) as first_date,
  MAX(date) as last_date
FROM time_slots;

-- Show some examples
SELECT date, start_time, end_time, capacity, predicted_traffic
FROM time_slots
ORDER BY date, start_time
LIMIT 10;
