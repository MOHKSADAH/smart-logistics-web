# Smart Logistics API Testing Script
# Tests all API endpoints systematically
# Run: ./scripts/test-all-apis.ps1

$baseUrl = "http://localhost:3000"
$testResults = @()

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Smart Logistics API Testing Suite" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan

# Helper function to test endpoint
function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$Description,
        [hashtable]$Body = $null,
        [hashtable]$Headers = @{"Content-Type" = "application/json"}
    )

    Write-Host "Testing: $Description" -ForegroundColor Yellow
    Write-Host "  $Method $Endpoint" -ForegroundColor Gray

    try {
        $params = @{
            Uri = "$baseUrl$Endpoint"
            Method = $Method
            Headers = $Headers
            TimeoutSec = 10
        }

        if ($Body -and $Method -ne "GET") {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }

        $response = Invoke-WebRequest @params -UseBasicParsing
        $statusCode = $response.StatusCode

        if ($statusCode -ge 200 -and $statusCode -lt 300) {
            Write-Host "  ✅ SUCCESS ($statusCode)" -ForegroundColor Green
            $result = "PASS"
        } else {
            Write-Host "  ⚠️  WARNING ($statusCode)" -ForegroundColor Yellow
            $result = "WARN"
        }

        # Parse response if JSON
        try {
            $jsonResponse = $response.Content | ConvertFrom-Json
            Write-Host "  Response: $($jsonResponse | ConvertTo-Json -Compress -Depth 2)" -ForegroundColor Gray
        } catch {
            Write-Host "  Response: $($response.Content.Substring(0, [Math]::Min(100, $response.Content.Length)))" -ForegroundColor Gray
        }

    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "  ❌ FAILED ($statusCode)" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        $result = "FAIL"
    }

    Write-Host ""

    $script:testResults += @{
        Description = $Description
        Endpoint = $Endpoint
        Method = $Method
        Result = $result
        StatusCode = $statusCode
    }
}

# ========================================
# 1. CHECK SERVER
# ========================================
Write-Host "`n=== 1. Server Health Check ===" -ForegroundColor Cyan
Test-Endpoint -Method "GET" -Endpoint "/" -Description "Homepage (Server Running)"

# ========================================
# 2. ORGANIZATION AUTHENTICATION
# ========================================
Write-Host "`n=== 2. Organization Authentication ===" -ForegroundColor Cyan

Test-Endpoint -Method "POST" -Endpoint "/api/org/auth/login" `
    -Description "Org Login (Valid Credentials)" `
    -Body @{
        email = "manager@smsa.com"
        password = "demo1234"
    }

Test-Endpoint -Method "POST" -Endpoint "/api/org/auth/login" `
    -Description "Org Login (Invalid Credentials)" `
    -Body @{
        email = "wrong@email.com"
        password = "wrongpass"
    }

Test-Endpoint -Method "GET" -Endpoint "/api/org/auth/login" `
    -Description "Check Session (No Session)"

Test-Endpoint -Method "DELETE" -Endpoint "/api/org/auth/login" `
    -Description "Logout"

# ========================================
# 3. ORGANIZATION - DRIVERS
# ========================================
Write-Host "`n=== 3. Organization Driver Management ===" -ForegroundColor Cyan

Test-Endpoint -Method "GET" -Endpoint "/api/org/drivers" `
    -Description "List Organization Drivers"

Test-Endpoint -Method "POST" -Endpoint "/api/org/drivers/register" `
    -Description "Register New Driver" `
    -Body @{
        name = "Test Driver $(Get-Random -Maximum 1000)"
        phone = "+966501234567"
        license_number = "TEST$(Get-Random -Maximum 10000)"
        vehicle_plate = "TST-$(Get-Random -Maximum 9999)"
        vehicle_type = "TRUCK_10TON"
        has_smartphone = $true
        prefers_sms = $false
    }

# ========================================
# 4. ORGANIZATION - JOBS
# ========================================
Write-Host "`n=== 4. Organization Job Management ===" -ForegroundColor Cyan

Test-Endpoint -Method "GET" -Endpoint "/api/org/jobs" `
    -Description "List All Jobs"

Test-Endpoint -Method "GET" -Endpoint "/api/org/jobs?status=PENDING" `
    -Description "List Pending Jobs (Filtered)"

Test-Endpoint -Method "POST" -Endpoint "/api/org/jobs/create" `
    -Description "Create Job (Peak Time - Should Warn)" `
    -Body @{
        customer_name = "Test Customer $(Get-Random -Maximum 1000)"
        container_number = "CONT$(Get-Random -Maximum 100000)"
        container_count = 20
        cargo_type = "STANDARD"
        pickup_location = "Dammam Port - Gate 3"
        destination = "Riyadh Industrial Area"
        preferred_date = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
        preferred_time = "10:00"
        notes = "Test job for API testing"
    }

Test-Endpoint -Method "POST" -Endpoint "/api/org/jobs/create" `
    -Description "Create Job (Night Time - No Warning)" `
    -Body @{
        customer_name = "Night Customer $(Get-Random -Maximum 1000)"
        container_count = 5
        cargo_type = "BULK"
        pickup_location = "Dammam Port - Gate 5"
        destination = "Jeddah"
        preferred_date = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
        preferred_time = "22:00"
        notes = "Night delivery test"
    }

# Note: These require job_id from previous steps
# Test-Endpoint -Method "POST" -Endpoint "/api/org/jobs/[job-id]/assign" -Description "Assign Driver"
# Test-Endpoint -Method "POST" -Endpoint "/api/org/jobs/[job-id]/auto-assign" -Description "Auto-Assign Driver"
# Test-Endpoint -Method "GET" -Endpoint "/api/org/jobs/[job-id]/track" -Description "Track Job"

# ========================================
# 5. DRIVER APIS (General)
# ========================================
Write-Host "`n=== 5. Driver APIs ===" -ForegroundColor Cyan

Test-Endpoint -Method "GET" -Endpoint "/api/drivers" `
    -Description "List All Drivers"

# Note: Requires driver_id
# Test-Endpoint -Method "GET" -Endpoint "/api/drivers/[driver-id]" -Description "Get Driver Details"

Test-Endpoint -Method "POST" -Endpoint "/api/drivers/register" `
    -Description "Register Driver (Legacy Endpoint)" `
    -Body @{
        name = "Legacy Driver $(Get-Random -Maximum 1000)"
        phone = "+966507654321"
        license_number = "LEG$(Get-Random -Maximum 10000)"
        vehicle_plate = "LEG-$(Get-Random -Maximum 9999)"
        vehicle_type = "TRUCK_20TON"
    }

# ========================================
# 6. DRIVER JOB MANAGEMENT (MISSING)
# ========================================
Write-Host "`n=== 6. Driver Job Management ===" -ForegroundColor Cyan

Test-Endpoint -Method "GET" -Endpoint "/api/driver/jobs/active" `
    -Description "Get Active Jobs (EXPECTED TO FAIL - Not Implemented)"

Test-Endpoint -Method "POST" -Endpoint "/api/driver/jobs/test-id/complete" `
    -Description "Complete Job (EXPECTED TO FAIL - Not Implemented)" `
    -Body @{
        completion_notes = "Test completion"
    }

# ========================================
# 7. PERMITS
# ========================================
Write-Host "`n=== 7. Permit Management ===" -ForegroundColor Cyan

Test-Endpoint -Method "GET" -Endpoint "/api/permits" `
    -Description "List All Permits"

Test-Endpoint -Method "POST" -Endpoint "/api/book" `
    -Description "Book Permit (Legacy)" `
    -Body @{
        driver_id = "test-driver-id"
        slot_id = "test-slot-id"
        vehicle_plate = "TST-1234"
        cargo_type = "STANDARD"
        destination = "Riyadh"
    }

Test-Endpoint -Method "POST" -Endpoint "/api/cancel" `
    -Description "Cancel Permit" `
    -Body @{
        permit_id = "test-permit-id"
        reason = "Testing cancellation"
    }

# ========================================
# 8. TIME SLOTS
# ========================================
Write-Host "`n=== 8. Time Slots ===" -ForegroundColor Cyan

$tomorrow = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
Test-Endpoint -Method "GET" -Endpoint "/api/slots?date=$tomorrow" `
    -Description "Get Available Slots for Tomorrow"

Test-Endpoint -Method "GET" -Endpoint "/api/slots?date=$tomorrow&status=AVAILABLE" `
    -Description "Get Only Available Slots"

# ========================================
# 9. TRAFFIC & LOCATIONS
# ========================================
Write-Host "`n=== 9. Traffic & Location Tracking ===" -ForegroundColor Cyan

Test-Endpoint -Method "POST" -Endpoint "/api/traffic" `
    -Description "Submit Traffic Update (Team 3)" `
    -Body @{
        camera_id = "CAM_TEST_01"
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        status = "MODERATE"
        vehicle_count = 120
        truck_count = 8
    }

Test-Endpoint -Method "POST" -Endpoint "/api/locations" `
    -Description "Submit GPS Location" `
    -Body @{
        driver_id = "test-driver-id"
        latitude = 26.3927
        longitude = 50.0888
        speed = 45.5
        heading = 180
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    }

# ========================================
# 10. REFERENCE DATA
# ========================================
Write-Host "`n=== 10. Reference Data ===" -ForegroundColor Cyan

Test-Endpoint -Method "GET" -Endpoint "/api/priority-rules" `
    -Description "Get Priority Rules"

# ========================================
# 11. UTILITY
# ========================================
Write-Host "`n=== 11. Utility Endpoints ===" -ForegroundColor Cyan

Test-Endpoint -Method "POST" -Endpoint "/api/seed-traffic" `
    -Description "Seed Test Traffic Data"

# ========================================
# 12. MISSING ENDPOINTS
# ========================================
Write-Host "`n=== 12. Missing Endpoints (Expected Failures) ===" -ForegroundColor Cyan

Test-Endpoint -Method "GET" -Endpoint "/api/vessels/upcoming" `
    -Description "Get Upcoming Vessels (NOT IMPLEMENTED)"

Test-Endpoint -Method "GET" -Endpoint "/api/analytics/daily" `
    -Description "Get Daily Analytics (NOT IMPLEMENTED)"

# ========================================
# TEST SUMMARY
# ========================================
Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan

$passed = ($testResults | Where-Object { $_.Result -eq "PASS" }).Count
$failed = ($testResults | Where-Object { $_.Result -eq "FAIL" }).Count
$warned = ($testResults | Where-Object { $_.Result -eq "WARN" }).Count
$total = $testResults.Count

Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "✅ Passed: $passed" -ForegroundColor Green
Write-Host "❌ Failed: $failed" -ForegroundColor Red
Write-Host "⚠️  Warnings: $warned" -ForegroundColor Yellow

Write-Host "`n--- Failed Tests ---" -ForegroundColor Red
$testResults | Where-Object { $_.Result -eq "FAIL" } | ForEach-Object {
    Write-Host "  ❌ $($_.Description)" -ForegroundColor Red
    Write-Host "     $($_.Method) $($_.Endpoint)" -ForegroundColor Gray
}

Write-Host "`n--- Endpoint Status ---" -ForegroundColor Cyan
$testResults | Format-Table Description, Method, Endpoint, Result, StatusCode -AutoSize

Write-Host "`nTest completed at $(Get-Date)" -ForegroundColor Gray
