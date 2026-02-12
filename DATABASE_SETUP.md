# Database Setup Guide

## 🚀 Run Migrations in Order

Run these SQL files in your **Supabase SQL Editor** in this exact order:

### 1. Organizations Table
```bash
supabase/migrations/003_organizations.sql
```
Creates:
- organizations table
- verify_password() function
- Seeds 3 companies: SMSA, Aramex, Naqel
- Login credentials: `manager@smsa.com` / `demo1234`

### 2. Update Drivers & Permits
```bash
supabase/migrations/004_update_drivers_permits.sql
```
Adds:
- organization_id to drivers
- has_smartphone, prefers_sms flags
- job_id, permit_code to permits
- Links existing drivers to organizations

### 3. Jobs Table
```bash
supabase/migrations/005_jobs.sql
```
Creates:
- jobs table (shipment assignments)
- Foreign key from permits to jobs

### 4. SQL Functions
```bash
supabase/migrations/006_functions.sql
```
Creates:
- `generate_permit_code()` - Creates P-YYYYMMDD-XXXX codes
- `get_priority_from_cargo()` - Maps PERISHABLE → EMERGENCY
- `adjust_slot_capacity_for_vessels()` - Reduces capacity 8am-2pm
- `find_best_slot()` - Finds available slot matching preferences

### 5. Seed Vessels & Time Slots
```bash
supabase/migrations/007_seed_vessels_slots.sql
```
Seeds:
- 24 realistic vessels (next 7 days, arriving 6-9am)
- 84 time slots (24/7 operation, 2-hour intervals)
- Adjusts capacity based on vessel arrivals
- Marks 8am-2pm slots as CONGESTED

---

## ✅ Verification

After running all migrations, check:

```sql
-- Should return 3 organizations
SELECT name, email, authorized_priorities FROM organizations;

-- Should show drivers linked to organizations
SELECT d.name, o.name as org_name, d.has_smartphone
FROM drivers d
LEFT JOIN organizations o ON d.organization_id = o.id;

-- Should show 24 vessels
SELECT COUNT(*) FROM vessel_schedules WHERE arrival_date >= CURRENT_DATE;

-- Should show 84 time slots (7 days × 12 slots per day)
SELECT COUNT(*) FROM time_slots WHERE date >= CURRENT_DATE;

-- Should show slots with adjusted capacity
SELECT date, start_time, capacity, predicted_traffic
FROM time_slots
WHERE date = CURRENT_DATE + 1
ORDER BY start_time;
```

Expected output for tomorrow's slots:
- **6am-8am**: Capacity 200 (night shift)
- **8am-2pm**: Capacity 50-80 (CONGESTED due to vessels)
- **6pm-10pm**: Capacity 150 (evening shift)

---

## 📊 Demo Credentials

### Organization Logins
- **SMSA Express**: `manager@smsa.com` / `demo1234`
  - Can use: EMERGENCY, ESSENTIAL, NORMAL, LOW
- **Aramex**: `dispatch@aramex.com` / `demo1234`
  - Can use: ESSENTIAL, NORMAL, LOW
- **Naqel Express**: `ops@naqel.com` / `demo1234`
  - Can use: NORMAL, LOW

### Key Concepts
- **Vessels arrive**: 6-9am (early morning)
- **Containers ready**: 8am-2pm (after 2-4 hour processing)
- **Truck surge**: 8am-2pm (vessel-driven congestion)
- **Solution**: System warns companies, incentivizes night shifts

---

## 🔧 Troubleshooting

**Error: "function update_updated_at_column() does not exist"**
- Run the original schema migrations first (001_create_schema.sql, 002_drivers_table.sql)

**Error: "relation 'drivers' does not exist"**
- Drivers table must exist before running these migrations
- Check if you've run the initial schema setup

**Error: "ON CONFLICT specification"**
- Fixed in 007 - removed ON CONFLICT clause

---

**Ready to start building!** 🚀

All database schema and seed data is now in place for the organization-based job management system.
