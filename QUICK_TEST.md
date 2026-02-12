# Quick API Testing Guide

## Step 1: Start the Dev Server

```bash
npm run dev
```

Wait for: `✓ Ready in [X]s` message
Note the port (usually 3000 or random like 54112)

---

## Step 2: Test Using Browser

Open these URLs in your browser to test each endpoint:

### Test 1: Check Server is Running
```
http://localhost:3000/
```
✅ Should show the homepage (or 404 is OK)

### Test 2: List Drivers
```
http://localhost:3000/api/drivers
```
✅ Should return JSON with drivers list or error

### Test 3: Get Time Slots (Tomorrow)
```
http://localhost:3000/api/slots?date=2026-02-13
```
✅ Should return available time slots

### Test 4: New Driver Jobs Endpoint
```
http://localhost:3000/api/driver/jobs/active?driver_id=test-123
```
✅ Should return JSON (may be empty array if no jobs)

---

## Step 3: Test with PowerShell (Quick Commands)

Replace `3000` with your actual port number:

```powershell
# Test 1: Homepage
Invoke-WebRequest http://localhost:3000/ | Select-Object StatusCode

# Test 2: List Drivers
Invoke-WebRequest http://localhost:3000/api/drivers | Select-Object Content

# Test 3: Time Slots
Invoke-WebRequest http://localhost:3000/api/slots?date=2026-02-13 | ConvertFrom-Json

# Test 4: Organization Login
$body = @{
    email = "manager@smsa.com"
    password = "demo1234"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3000/api/org/auth/login `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

---

## Step 4: Test Organization Portal (Browser)

1. Open: `http://localhost:3000/org-login`
2. Login with: `manager@smsa.com` / `demo1234`
3. Should redirect to: `http://localhost:3000/org`

---

## Step 5: Check Database Connection

If endpoints return errors like "Missing Supabase credentials" or 500 errors:

1. Check your `.env` file has:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. Restart the dev server:
   ```bash
   # Stop server (Ctrl+C)
   # Start again
   npm run dev
   ```

---

## Common Issues

### 404 Not Found
- **Cause:** API route doesn't exist
- **Fix:** Check the file exists in `app/api/` folder

### 500 Internal Server Error
- **Cause:** Database error or missing credentials
- **Fix:** Check `.env` file and Supabase connection

### 401 Unauthorized
- **Cause:** No session/authentication
- **Fix:** Login first via `/org-login` or pass auth token

### CORS Error
- **Cause:** Testing from different origin
- **Fix:** Use same localhost port

---

## Expected Results

### Working Endpoints (Should Return 200)
- `GET /api/drivers` → List of drivers
- `GET /api/slots` → Time slots
- `GET /api/permits` → Permits list
- `POST /api/traffic` → Success message
- `POST /api/locations` → Success message

### Auth Required (Should Return 401 if not logged in)
- `GET /api/org/drivers` → Unauthorized
- `GET /api/org/jobs` → Unauthorized
- `POST /api/org/jobs/create` → Unauthorized

### New Endpoints (Just Implemented)
- `GET /api/driver/jobs/active?driver_id=xxx` → Jobs list
- `POST /api/driver/jobs/[id]/complete` → Success message

---

## Next: Run Full Test Suite

Once basic tests work, run the comprehensive test script:

```powershell
./scripts/test-all-apis.ps1
```

This will test all 23 endpoints automatically and generate a report.
