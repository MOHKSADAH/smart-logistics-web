-- Drivers Table Migration
-- This table stores registered truck drivers who use the mobile app

-- Create drivers table if it doesn't exist
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY,                      -- From Supabase auth (matches user.id)
  phone VARCHAR(20) NOT NULL UNIQUE,        -- E.164 format: +966XXXXXXXXX
  name VARCHAR(255) NOT NULL,
  vehicle_plate VARCHAR(50) NOT NULL,
  vehicle_type VARCHAR(50) NOT NULL,        -- TRUCK, CONTAINER, TANKER, FLATBED
  push_token TEXT,                          -- For push notifications (nullable)
  is_active BOOLEAN DEFAULT true,           -- Can be set to false to ban driver
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add push_token column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'drivers' AND column_name = 'push_token'
  ) THEN
    ALTER TABLE drivers ADD COLUMN push_token TEXT;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_drivers_phone ON drivers(phone);
CREATE INDEX IF NOT EXISTS idx_drivers_is_active ON drivers(is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_drivers_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists, then recreate
DROP TRIGGER IF EXISTS update_drivers_updated_at ON drivers;

CREATE TRIGGER update_drivers_updated_at
BEFORE UPDATE ON drivers
FOR EACH ROW
EXECUTE FUNCTION update_drivers_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Drivers can view own data" ON drivers;
DROP POLICY IF EXISTS "Drivers can update own data" ON drivers;
DROP POLICY IF EXISTS "Service role has full access" ON drivers;
DROP POLICY IF EXISTS "Anyone can register as driver" ON drivers;

-- Policy: Drivers can view only their own data
CREATE POLICY "Drivers can view own data"
ON drivers
FOR SELECT
USING (auth.uid() = id);

-- Policy: Drivers can update only their own data (name, vehicle info, push token)
CREATE POLICY "Drivers can update own data"
ON drivers
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Allow service role to do anything (for backend operations)
CREATE POLICY "Service role has full access"
ON drivers
FOR ALL
USING (auth.role() = 'service_role');

-- Policy: Allow insert for new driver registration (public)
CREATE POLICY "Anyone can register as driver"
ON drivers
FOR INSERT
WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE drivers IS 'Registered truck drivers using the mobile app';
COMMENT ON COLUMN drivers.id IS 'UUID from Supabase Auth (user.id)';
COMMENT ON COLUMN drivers.phone IS 'Phone number in E.164 format (+966XXXXXXXXX)';
COMMENT ON COLUMN drivers.vehicle_type IS 'Type of vehicle: TRUCK, CONTAINER, TANKER, or FLATBED';
COMMENT ON COLUMN drivers.push_token IS 'FCM/APNS token for push notifications';
COMMENT ON COLUMN drivers.is_active IS 'Set to false to ban/deactivate driver';
