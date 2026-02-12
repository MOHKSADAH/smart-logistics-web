# API Testing Guide
**Date:** February 12, 2026
**Purpose:** Test all APIs and ensure everything works correctly

---

## 🚀 Quick Start

### 1. Setup Environment Variables
```bash
# Copy the example file
cp .env.local.example .env.local

# Edit .env.local and add your Supabase credentials
# Get from: https://app.supabase.com/project/_/settings/api
```

**Required Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-only)

### 2. Start Development Server
```bash
npm run dev
# Server will start on http://localhost:3000 (or another port)
```

### 3. Run Automated Tests
```powershell
# PowerShell (Windows)
./scripts/test-all-apis.ps1

# OR use the HTTP file in VS Code with REST Client extension
# Open: test-apis.http
```

---

## 📊 Current API Status

### ✅ Implemented & Working (21 endpoints)

#### Organization Portal (10 endpoints)
1. `POST /api/org/auth/login` - Login with email/password
2. `GET /api/org/auth/login` - Check session
3. `DELETE /api/org/auth/login` - Logout
4. `GET /api/org/drivers` - List company drivers
5. `POST /api/org/drivers/register` - Register driver
6. `GET /api/org/jobs` - List jobs (with filters)
7. `POST /api/org/jobs/create` - Create job + vessel warning
8. `POST /api/org/jobs/[id]/assign` - Assign driver manually
9. `POST /api/org/jobs/[id]/auto-assign` - Auto-assign driver
10. `GET /api/org/jobs/[id]/track` - Track job progress

#### Driver Management (3 endpoints)
11. `GET /api/drivers` - List all drivers
12. `GET /api/drivers/[id]` - Get driver details
13. `POST /api/drivers/register` - Register driver (legacy)

#### Permits (3 endpoints)
14. `GET /api/permits` - List permits
15. `POST /api/book` - Book permit (legacy)
16. `POST /api/cancel` - Cancel permit

#### Time Slots (1 endpoint)
17. `GET /api/slots` - Get available slots

#### Traffic & Location (2 endpoints)
18. `POST /api/traffic` - Receive traffic updates (Team 3)
19. `POST /api/locations` - Record GPS location

#### Reference Data (1 endpoint)
20. `GET /api/priority-rules` - Get priority rules

#### Utility (1 endpoint)
21. `POST /api/seed-traffic` - Seed test data

---

### ❌ Missing - Critical for Team 2 (2 endpoints)

These are **REQUIRED** for mobile app integration:

1. `GET /api/driver/jobs/active` - Get assigned jobs for driver
   - **Priority:** HIGH
   - **Team 2 Blocker:** Yes
   - **Replaces:** Individual permit booking

2. `POST /api/driver/jobs/[job_id]/complete` - Mark job complete
   - **Priority:** HIGH
   - **Team 2 Blocker:** Yes
   - **Updates:** Driver availability, job status

---

### ❌ Missing - Dashboard Features (2 endpoints)

These are **OPTIONAL** for admin dashboard:

3. `GET /api/vessels/upcoming` - Get vessel schedules
   - **Priority:** MEDIUM
   - **Used by:** Dashboard vessel widget
   - **Workaround:** Query vessel_schedules table directly

4. `GET /api/analytics/daily` - Get daily analytics
   - **Priority:** LOW
   - **Used by:** Dashboard charts
   - **Workaround:** Query database directly

---

## 🔍 API Analysis

### Duplicates Found

**Driver Registration (2 endpoints):**
- `/api/drivers/register` - Legacy, no organization link
- `/api/org/drivers/register` - New, links to organization

**Recommendation:** Deprecate `/api/drivers/register` or make it redirect to org version

---

### Legacy vs New System

| Feature | Legacy API | New API | Status |
|---------|-----------|---------|--------|
| Driver Registration | POST /api/drivers/register | POST /api/org/drivers/register | ⚠️ Duplicate |
| Permit Booking | POST /api/book | Auto-generated via jobs | ✅ Keep for fallback |
| Permit Cancellation | POST /api/cancel | N/A | ✅ Still needed |
| Driver Jobs | N/A | GET /api/driver/jobs/active | ❌ Missing |
| Job Completion | N/A | POST /api/driver/jobs/[id]/complete | ❌ Missing |

---

## 🧪 Manual Testing Checklist

### Phase 1: Organization Portal (Priority: HIGH)

- [ ] **Login:** Test with valid credentials (manager@smsa.com / demo1234)
- [ ] **Login:** Test with invalid credentials (should fail)
- [ ] **Session:** Check session persists after login
- [ ] **Logout:** Verify session cleared after logout

- [ ] **Drivers:** List all organization drivers
- [ ] **Drivers:** Register new driver with all fields
- [ ] **Drivers:** Verify driver appears in list

- [ ] **Jobs:** List all jobs (no filters)
- [ ] **Jobs:** List pending jobs only
- [ ] **Jobs:** Create job for peak time (10am-2pm) → Should show vessel warning
- [ ] **Jobs:** Create job for night time (10pm) → No warning
- [ ] **Jobs:** Manually assign driver to job → Permit created?
- [ ] **Jobs:** Auto-assign driver → Best driver selected? Permit created?
- [ ] **Jobs:** Track job progress → Shows driver location?

### Phase 2: Driver APIs (Priority: MEDIUM)

- [ ] **List Drivers:** Returns all drivers
- [ ] **Get Driver:** Returns specific driver details
- [ ] **Register Driver:** Creates new driver (check for duplicates with org endpoint)

### Phase 3: Permits & Slots (Priority: MEDIUM)

- [ ] **List Permits:** Shows all permits
- [ ] **Book Permit:** Legacy booking still works?
- [ ] **Cancel Permit:** Can cancel existing permit
- [ ] **Get Slots:** Returns available slots for specific date
- [ ] **Get Slots:** Filters work (status=AVAILABLE)

### Phase 4: Traffic & Location (Priority: HIGH - Team 3 Integration)

- [ ] **Traffic Update:** Team 3 can submit traffic data
- [ ] **Traffic Update:** CONGESTED status triggers permit halting
- [ ] **Traffic Update:** EMERGENCY permits stay APPROVED
- [ ] **GPS Location:** Driver location recorded successfully

### Phase 5: Missing Endpoints (Priority: CRITICAL)

- [ ] **Driver Jobs:** Implement GET /api/driver/jobs/active
- [ ] **Job Completion:** Implement POST /api/driver/jobs/[id]/complete
- [ ] **Vessels:** Implement GET /api/vessels/upcoming (optional)
- [ ] **Analytics:** Implement GET /api/analytics/daily (optional)

---

## 🚨 Critical Issues Found

### 1. Missing Database Setup
**Issue:** API endpoints exist but database might not have required tables/functions

**Tables Needed:**
- `organizations` - Logistics companies
- `jobs` - Delivery assignments
- `vessel_schedules` - Ship arrivals
- Modified `drivers` table with `organization_id`
- Modified `permits` table with `job_id`

**Functions Needed:**
- `get_priority_from_cargo(cargo_type)` → Returns priority level
- `find_best_slot(date, time, priority)` → Returns optimal slot
- `generate_permit_code()` → Creates human-readable code
- `halt_permits_by_priority(status)` → Halts low-priority permits

**Action Required:** Check Supabase dashboard and apply migrations

---

### 2. Environment Variables Missing
**Issue:** `.env.local` doesn't exist, server will fail

**Action Required:**
1. Copy `.env.local.example` to `.env.local`
2. Add Supabase credentials
3. Restart dev server

---

### 3. Driver Job Endpoints Missing
**Issue:** Team 2 cannot integrate without these endpoints

**Impact:** Mobile app cannot:
- Show assigned jobs to drivers
- Complete jobs after delivery
- Update driver availability

**Action Required:** Implement these 2 endpoints immediately

---

## 🛠️ Implementation Plan

### Immediate (Today)

1. **Setup Database**
   - Check Supabase dashboard
   - Apply missing migrations (003-007)
   - Verify all tables exist
   - Test database functions

2. **Configure Environment**
   - Create `.env.local` with Supabase credentials
   - Restart dev server
   - Verify no errors in console

3. **Test Organization APIs**
   - Run test script: `./scripts/test-all-apis.ps1`
   - Fix any failing endpoints
   - Document issues found

### Priority (Next 2 Hours)

4. **Implement Driver Job Endpoints**
   - `GET /api/driver/jobs/active`
   - `POST /api/driver/jobs/[job_id]/complete`
   - Test with Postman/REST Client
   - Share with Team 2

5. **Remove/Deprecate Duplicates**
   - Decide on `/api/drivers/register` vs `/api/org/drivers/register`
   - Add deprecation warnings if keeping legacy

### Optional (Day 3-4)

6. **Implement Dashboard Endpoints**
   - `GET /api/vessels/upcoming`
   - `GET /api/analytics/daily`

7. **Integration Testing**
   - Test full flow: Create job → Assign driver → Driver completes
   - Test with Team 3: Traffic update → Permit halting
   - Test with Team 2: Job appears in mobile app

---

## 📝 Testing Results Template

After running tests, document results here:

```
Date: [Date]
Tester: [Name]
Server: [URL]
Database: [Supabase Project]

=== PASSED ===
- [Endpoint] - [Description]

=== FAILED ===
- [Endpoint] - [Description] - [Error]

=== MISSING ===
- [Endpoint] - [Required by]

=== NOTES ===
- [Any observations]
```

---

## 🤝 Team Coordination

### Before Testing
- **Team 1:** Ensure dev server running
- **Team 1:** Database migrations applied
- **Team 1:** Environment variables configured

### After Testing
- **Team 1 → Team 2:** Share test results for driver job endpoints
- **Team 1 → Team 3:** Confirm traffic endpoint working
- **All Teams:** Document any blocking issues

---

## 📞 Support

**Issues Found?**
1. Check server logs: `dev-server.log`
2. Check Supabase logs: Dashboard → Logs
3. Test with Postman/REST Client for detailed errors
4. Document in `API_AUDIT.md`

**Questions?**
- Check: `CLAUDE.md`, `STATUS.md`, `TEAM_COORDINATION.md`
- Review: `TEAM2_MOBILE_APP_PLAN.md` for mobile app requirements

---

**Last Updated:** February 12, 2026
**Next Review:** After implementing missing endpoints
