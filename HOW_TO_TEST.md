# How to Test the APIs - Simple Guide

## Method 1: Quick Browser Test (Easiest)

### Step 1: Start the Server
```bash
npm run dev
```

Look for this message:
```
✓ Ready in 2.5s
- Local: http://localhost:3000
```

### Step 2: Open URLs in Browser

Copy and paste these URLs one by one into your browser:

**Test 1 - List Drivers:**
```
http://localhost:3000/api/drivers
```
✅ Should show JSON with drivers list

**Test 2 - Get Time Slots:**
```
http://localhost:3000/api/slots?date=2026-02-13
```
✅ Should show available time slots

**Test 3 - New Driver Jobs Endpoint:**
```
http://localhost:3000/api/driver/jobs/active?driver_id=test-123
```
✅ Should show `{"success":true,"count":0,"jobs":[]}`

**Test 4 - List Permits:**
```
http://localhost:3000/api/permits
```
✅ Should show permits list

---

## Method 2: Test Organization Portal (Web UI)

### Step 1: Open Login Page
```
http://localhost:3000/org-login
```

### Step 2: Login with Demo Account
- **Email:** `manager@smsa.com`
- **Password:** `demo1234`

### Step 3: Navigate
- Should redirect to: `http://localhost:3000/org`
- Click "Jobs" in the sidebar
- Click "Create New Job"

### Step 4: Create a Test Job
Fill in:
- Customer Name: ABC Company
- Pickup: Dammam Port
- Destination: Riyadh
- Cargo Type: STANDARD
- Date: Tomorrow's date
- Time: 10:00
- Container Count: 10

Click "Create Job"

### Step 5: Auto-Assign Driver
After creating the job, click the blue button:
```
🚀 Auto-Assign Best Driver
```

✅ Should assign a driver and create a permit

---

## Method 3: PowerShell Script (Automated)

### Run the Test Script
```powershell
# Make sure you're in the project directory
cd "c:\Users\pc\Documents\Personal Projects\smart-logistics-web"

# Run the simple test script
./test-simple.ps1
```

This will test 9 endpoints and show results.

---

## Method 4: VS Code REST Client (For Developers)

### Step 1: Install Extension
1. Open VS Code
2. Install extension: "REST Client" by Huachao Mao

### Step 2: Open Test File
```
File: test-apis.http
```

### Step 3: Click "Send Request"
Click the "Send Request" link above each test case.

---

## What to Check

### ✅ Working Correctly
- Endpoints return JSON (not HTML)
- Status code 200 or 201 for success
- Error messages are clear (not "Internal Server Error")

### ❌ Common Issues

**Issue: "Cannot read properties of undefined"**
- **Cause:** Database tables don't exist
- **Fix:** Check Supabase dashboard, apply migrations

**Issue: "Missing Supabase credentials"**
- **Cause:** .env file missing variables
- **Fix:** Check your `.env` file has all 3 variables

**Issue: 404 Not Found**
- **Cause:** Route doesn't exist or server not restarted
- **Fix:** Restart server: Stop (Ctrl+C) and `npm run dev` again

**Issue: 401 Unauthorized**
- **Cause:** Endpoint requires authentication
- **Fix:** Login first via `/org-login` or pass auth token

---

## Test Results You Should See

### Good Response (Success):
```json
{
  "success": true,
  "drivers": [...]
}
```

### Good Response (Empty):
```json
{
  "success": true,
  "count": 0,
  "jobs": []
}
```

### Expected Error (No Auth):
```json
{
  "success": false,
  "error": "Not authenticated"
}
```

### Bad Response (Needs Fix):
```json
{
  "error": "Internal server error"
}
```
→ This means something is broken (database, env variables, etc.)

---

## Quick Checklist

Before testing, verify:

- [ ] Server is running: `npm run dev`
- [ ] Can open: `http://localhost:3000/`
- [ ] `.env` file exists with Supabase credentials
- [ ] Supabase project is active (not paused)
- [ ] Database tables exist (check Supabase dashboard)

---

## What to Test First

### Priority 1 (Must Work):
1. Organization login: `http://localhost:3000/org-login`
2. List drivers: `http://localhost:3000/api/drivers`
3. List jobs: `http://localhost:3000/api/org/jobs`
4. Create job: Via web UI after login

### Priority 2 (Team 2 Needs):
5. Driver jobs: `http://localhost:3000/api/driver/jobs/active?driver_id=xxx`
6. Complete job: Test via Postman/REST Client

### Priority 3 (Team 3 Integration):
7. Traffic update: `POST /api/traffic`
8. GPS location: `POST /api/locations`

---

## Next Steps After Testing

1. **If all working:** Share with Team 2 and Team 3
2. **If errors:** Check server logs in terminal
3. **Database issues:** Go to Supabase dashboard and verify tables
4. **Still stuck:** Check `API_SUMMARY.md` for detailed troubleshooting

---

**Pro Tip:** Keep the terminal open to see real-time API logs. Any errors will show up there immediately.
