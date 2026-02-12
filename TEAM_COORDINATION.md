# Team Coordination Guide
**Dammam Urban Development Challenge 2025 - Challenge #2**
**Date:** February 12, 2026
**Status:** Organization Portal Complete - Ready for Integration

---

## 🚀 What Changed: Organization-Based System

### OLD Paradigm (Before Feb 12):
❌ Individual drivers book permits themselves

### NEW Paradigm (Current):
✅ **Organizations create jobs → Assign drivers → Permits auto-generated**

**Key Innovation:** Vessel-driven congestion prediction
- Vessels arrive 6-9am → Containers ready 8am-2pm → Truck surge
- System predicts congestion, warns organizations, suggests night shifts

---

## 📊 System Status

### ✅ Completed (Team 1 - Backend & Dashboard)

#### **API Endpoints (8 routes)**
1. `POST /api/org/auth/login` - Organization login (optimized, 1 DB call)
2. `GET /api/org/auth/login` - Check session
3. `DELETE /api/org/auth/login` - Logout
4. `GET /api/org/drivers` - List company drivers
5. `POST /api/org/drivers/register` - Register new driver
6. `GET /api/org/jobs` - List jobs with filters
7. `POST /api/org/jobs/create` - Create job + vessel warning (optimized, parallel queries)
8. `POST /api/org/jobs/[job_id]/assign` - Manual driver assignment
9. **POST /api/org/jobs/[job_id]/auto-assign** ⚡ NEW - Auto-assign best driver
10. `GET /api/org/jobs/[job_id]/track` - Track job progress

#### **Features**
- ✅ Session-based authentication (cookies, 24hr expiry)
- ✅ Auto-assign: One-click driver assignment
- ✅ Vessel warning: Shows congestion predictions when creating jobs
- ✅ Performance optimized: Parallel queries, reduced DB calls
- ✅ Arabic/English support: Login page + navigation
- ✅ Loading skeletons: Smooth UX
- ✅ Zero TypeScript errors
- ✅ Build passing

#### **Database**
- ✅ 5 migrations created (003-007)
- ⚠️ **NOT RUN YET** - Need to apply in Supabase SQL Editor

---

## 🔄 What Each Team Needs to Do

### **Team 1 (Backend & Dashboard)** - YOU ARE HERE

#### Immediate Tasks:
1. **Run Database Migrations** (5 files in order):
   ```bash
   # In Supabase SQL Editor, run in order:
   1. supabase/migrations/003_organizations.sql
   2. supabase/migrations/004_update_drivers_permits.sql
   3. supabase/migrations/005_jobs.sql
   4. supabase/migrations/006_functions.sql
   5. supabase/migrations/007_seed_vessels_slots.sql
   ```

2. **Test Organization Portal**:
   - Go to `/org-login?lang=ar` (test Arabic)
   - Login: `manager@smsa.com` / `demo1234`
   - Create job → Should show vessel warning if 8am-2pm
   - Click "Auto-Assign" → Should assign driver + create permit
   - Check jobs list → Permit code should appear

3. **Finish Dashboard Pages** (Optional - Low Priority):
   - `/org` - Add stats cards (total jobs, active jobs, drivers)
   - `/org/drivers` - Add driver list with register button

4. **Deploy to Vercel**:
   ```bash
   git add .
   git commit -m "Add organization portal with auto-assign"
   git push
   ```

#### Testing Checklist:
- [ ] Login works (EN + AR)
- [ ] Create job shows vessel warning
- [ ] Auto-assign creates permit
- [ ] Jobs list shows all jobs
- [ ] Language toggle works

---

### **Team 2 (Mobile App)** - INTEGRATION REQUIRED

#### Changes to Your App:

**OLD Flow (Remove):**
```
Driver opens app → Selects cargo type → Books permit
```

**NEW Flow (Implement):**
```
Organization assigns job → Driver receives notification → Driver views job in app
```

#### New API Endpoints to Use:

1. **GET /api/driver/jobs/active** ⚠️ NEW
   - Replaces individual permit booking
   - Returns assigned jobs with permit details
   ```json
   {
     "jobs": [{
       "job_id": "uuid",
       "job_number": "JOB-20260212-001",
       "customer_name": "ABC Company",
       "pickup_location": "Dammam Port",
       "destination": "Riyadh",
       "permit": {
         "permit_code": "P-20260212-1234",
         "qr_code": "PERMIT-abc123-1234567890",
         "status": "APPROVED",
         "time_slot": { "start_time": "10:00", "end_time": "12:00" }
       }
     }]
   }
   ```

2. **POST /api/driver/jobs/{job_id}/complete**
   - Mark job as completed
   - Updates driver availability

3. **Existing endpoints still work:**
   - GET /api/slots - Available time slots
   - POST /api/locations - GPS tracking
   - GET /api/permits - View permits

#### UI Changes Needed:

**Home Screen:**
- Remove: "Book Permit" button
- Add: "Active Jobs" list
- Add: Job cards showing customer, pickup, destination, permit code

**Notifications:**
- Listen for: "New Job Assigned" notification
- Show: Job details + permit QR code
- Driver can't book permits manually anymore

**Job Details Screen:**
- Show: Customer name, pickup, destination, time slot
- Show: Permit QR code (for checkpoint scanning)
- Button: "Mark Complete"

#### Testing:
1. Organization creates job via web portal
2. Organization clicks "Auto-Assign" → Driver selected
3. Driver receives notification (SMS or App)
4. Driver opens app → Sees job in "Active Jobs"
5. Driver completes job → Marks complete in app

---

### **Team 3 (AI/Computer Vision)** - NO CHANGES

Your integration remains the same:

**Endpoint:** `POST /api/traffic`
**Payload:**
```json
{
  "camera_id": "CAM_01_KING_ABDULAZIZ",
  "timestamp": "2026-02-12T14:30:00Z",
  "status": "CONGESTED",
  "vehicle_count": 145,
  "truck_count": 12
}
```

**What Happens:**
- Backend receives traffic update
- Calls `halt_permits_by_priority('CONGESTED')`
- NORMAL & LOW permits → Halted
- EMERGENCY & ESSENTIAL permits → Protected
- Affected drivers get notifications

**No changes needed to your code!**

---

## 📝 Database Schema Updates

### New Tables:

**organizations**
- Logistics companies (SMSA, Aramex, Naqel)
- Email/password authentication
- Authorized priority levels

**jobs**
- Delivery assignments created by organizations
- Links: organization_id, assigned_driver_id, permit_id
- Status: PENDING → ASSIGNED → IN_PROGRESS → COMPLETED

**vessel_schedules**
- Ship arrivals at Dammam port
- Drives congestion predictions

### Updated Tables:

**drivers**
- Added: `organization_id` (links to company)
- Added: `has_smartphone`, `prefers_sms` (notification routing)

**permits**
- Now auto-generated when job assigned
- Linked to job via `job_id`

**time_slots**
- 24/7 slots (12 per day × 7 days = 84 slots)
- Capacity: 200 (night), 100 (off-peak), 50 (peak 8am-2pm)

---

## 🔑 Demo Credentials

```
SMSA Express:     manager@smsa.com  / demo1234
Aramex:           dispatch@aramex.com / demo1234
Naqel Express:    ops@naqel.com / demo1234
```

All have:
- Authorized priorities: NORMAL, LOW
- Can create jobs, assign drivers
- Full access to organization portal

---

## 🌐 Deployment URLs

**Production:** https://smart-logistics-web.vercel.app

**Organization Portal:**
- Login: `/org-login` or `/org-login?lang=ar`
- Dashboard: `/org`
- Jobs: `/org/jobs`
- Create Job: `/org/jobs/create`
- Drivers: `/org/drivers`

**Admin Dashboard (Team 1):** `/en` or `/ar`

---

## 📞 Integration Meeting Points

### Daily Standup Topics:
1. **Team 2:** Have you updated mobile app to use new job-based flow?
2. **Team 3:** Is traffic data still flowing to POST /api/traffic?
3. **All:** Any blockers with the new organization system?

### Critical Handoffs:
- **Team 1 → Team 2:** Test organization creates job → driver receives it
- **Team 3 → Team 1:** Verify traffic status triggers permit halting
- **Team 1 → All:** Share updated API documentation

---

## 🚨 Known Limitations (Hackathon Prototype)

1. **Trust-based priority:** Organizations self-select cargo type (no verification)
2. **Simulated vessels:** Manually entered, not live Mawani API
3. **Heuristic predictions:** Not ML models (time constraint)
4. **Demo data:** Test organizations, drivers, vessels pre-seeded

---

## 📊 Success Metrics for Demo

- ✅ Organization logs in, creates job in < 30 seconds
- ✅ Auto-assign works in < 2 seconds
- ✅ Vessel warning appears when booking 8am-2pm slots
- ✅ EMERGENCY permits stay active during CONGESTED traffic
- ✅ Mobile app shows assigned jobs (Team 2)
- ✅ Traffic updates trigger permit halting (Team 3)

---

## 🎯 Final Testing Checklist (All Teams)

### Before Demo Day:
- [ ] **Team 1:** All database migrations applied
- [ ] **Team 1:** Organization portal tested (EN + AR)
- [ ] **Team 2:** Mobile app shows assigned jobs
- [ ] **Team 2:** Driver can complete jobs
- [ ] **Team 3:** Traffic camera sends updates
- [ ] **All:** End-to-end flow: Job created → Driver notified → Permit scanned → Job completed

---

**Last Updated:** February 12, 2026
**Next Review:** Before final demo (Day 4)
