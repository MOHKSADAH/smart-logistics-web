# Organization Portal API Test Script
# Run: .\test-org-apis.ps1

$baseUrl = "http://localhost:3000"
$sessionCookie = $null

Write-Host "`n=== ORGANIZATION PORTAL API TESTS ===" -ForegroundColor Cyan
Write-Host "Make sure dev server is running on $baseUrl`n" -ForegroundColor Yellow

# Test 1: Login
Write-Host "Test 1: POST /api/org/auth/login" -ForegroundColor Green
$loginBody = @{
    email = "manager@smsa.com"
    password = "demo1234"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/org/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json" `
        -SessionVariable session `
        -ErrorAction Stop

    $result = $response.Content | ConvertFrom-Json
    Write-Host "✓ Login successful: $($result.organization.name)" -ForegroundColor Green
    $sessionCookie = $session.Cookies.GetCookies("$baseUrl")["org_session"]
    Write-Host "  Session cookie: $($sessionCookie.Value.Substring(0, 30))..." -ForegroundColor Gray
} catch {
    Write-Host "✗ Login failed: $_" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 1

# Test 2: Check Session
Write-Host "`nTest 2: GET /api/org/auth/login (session check)" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/org/auth/login" `
        -Method GET `
        -WebSession $session `
        -ErrorAction Stop

    $result = $response.Content | ConvertFrom-Json
    Write-Host "✓ Session valid: $($result.organization.name)" -ForegroundColor Green
} catch {
    Write-Host "✗ Session check failed: $_" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# Test 3: List Drivers
Write-Host "`nTest 3: GET /api/org/drivers" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/org/drivers" `
        -Method GET `
        -WebSession $session `
        -ErrorAction Stop

    $result = $response.Content | ConvertFrom-Json
    Write-Host "✓ Fetched $($result.drivers.Count) drivers" -ForegroundColor Green
    if ($result.drivers.Count -gt 0) {
        Write-Host "  Example: $($result.drivers[0].name) - $($result.drivers[0].vehicle_plate)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Failed to fetch drivers: $_" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# Test 4: Create Job
Write-Host "`nTest 4: POST /api/org/jobs/create" -ForegroundColor Green
$jobBody = @{
    customer_name = "Test Customer $(Get-Date -Format 'HHmmss')"
    container_number = "CONT-$(Get-Random -Maximum 9999)"
    container_count = 2
    cargo_type = "STANDARD"
    pickup_location = "Dammam Port"
    destination = "Riyadh Warehouse"
    preferred_date = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
    preferred_time = "10:00"
    notes = "API Test Job"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/org/jobs/create" `
        -Method POST `
        -Body $jobBody `
        -ContentType "application/json" `
        -WebSession $session `
        -ErrorAction Stop

    $result = $response.Content | ConvertFrom-Json
    Write-Host "✓ Job created: $($result.job_number)" -ForegroundColor Green
    Write-Host "  Priority: $($result.priority)" -ForegroundColor Gray
    Write-Host "  Available drivers: $($result.available_drivers.Count)" -ForegroundColor Gray

    if ($result.vessel_warning) {
        Write-Host "  ⚠️ Vessel warning: $($result.vessel_warning.message)" -ForegroundColor Yellow
    }

    $global:testJobId = $result.job_id
    $global:testJobNumber = $result.job_number
} catch {
    Write-Host "✗ Failed to create job: $_" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# Test 5: List Jobs
Write-Host "`nTest 5: GET /api/org/jobs" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/org/jobs" `
        -Method GET `
        -WebSession $session `
        -ErrorAction Stop

    $result = $response.Content | ConvertFrom-Json
    Write-Host "✓ Fetched $($result.jobs.Count) jobs" -ForegroundColor Green

    $pending = ($result.jobs | Where-Object { $_.status -eq "PENDING" }).Count
    $assigned = ($result.jobs | Where-Object { $_.status -eq "ASSIGNED" }).Count
    Write-Host "  Pending: $pending | Assigned: $assigned" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to fetch jobs: $_" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# Test 6: Auto-Assign Job
if ($global:testJobId) {
    Write-Host "`nTest 6: POST /api/org/jobs/$($global:testJobId)/auto-assign" -ForegroundColor Green
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/org/jobs/$($global:testJobId)/auto-assign" `
            -Method POST `
            -WebSession $session `
            -ErrorAction Stop

        $result = $response.Content | ConvertFrom-Json
        Write-Host "✓ Auto-assigned to: $($result.driver.name)" -ForegroundColor Green
        Write-Host "  Permit code: $($result.permit.permit_code)" -ForegroundColor Gray
        Write-Host "  Notification: $($result.notification_sent)" -ForegroundColor Gray
    } catch {
        $errorContent = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "✗ Auto-assign failed: $($errorContent.error)" -ForegroundColor Red
        if ($errorContent.debug) {
            Write-Host "  Debug info: $($errorContent.debug | ConvertTo-Json -Compress)" -ForegroundColor Yellow
        }
    }

    Start-Sleep -Seconds 1
}

# Test 7: Track Job
if ($global:testJobId) {
    Write-Host "`nTest 7: GET /api/org/jobs/$($global:testJobId)/track" -ForegroundColor Green
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/org/jobs/$($global:testJobId)/track" `
            -Method GET `
            -WebSession $session `
            -ErrorAction Stop

        $result = $response.Content | ConvertFrom-Json
        Write-Host "✓ Job tracked: $($result.job.job_number)" -ForegroundColor Green
        Write-Host "  Status: $($result.job.status)" -ForegroundColor Gray
        if ($result.job.driver) {
            Write-Host "  Driver: $($result.job.driver.name)" -ForegroundColor Gray
        }
        if ($result.job.permit) {
            Write-Host "  Permit: $($result.job.permit.permit_code)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "✗ Failed to track job: $_" -ForegroundColor Red
    }

    Start-Sleep -Seconds 1
}

# Test 8: Logout
Write-Host "`nTest 8: DELETE /api/org/auth/login (logout)" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/org/auth/login" `
        -Method DELETE `
        -WebSession $session `
        -ErrorAction Stop

    $result = $response.Content | ConvertFrom-Json
    Write-Host "✓ Logged out: $($result.message)" -ForegroundColor Green
} catch {
    Write-Host "✗ Logout failed: $_" -ForegroundColor Red
}

Write-Host "`n=== TESTS COMPLETE ===" -ForegroundColor Cyan
Write-Host "All organization portal APIs tested!`n" -ForegroundColor Green
