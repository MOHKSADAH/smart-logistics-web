# Simple API Testing Script
# Run: ./test-simple.ps1

$baseUrl = "http://localhost:54112"

Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "   Quick API Test Suite" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan

# Helper function
function Test-API {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Body = $null
    )

    Write-Host "Testing: $Name" -ForegroundColor Yellow
    Write-Host "  URL: $Method $Url" -ForegroundColor Gray

    try {
        $params = @{
            Uri = $Url
            Method = $Method
            TimeoutSec = 10
            UseBasicParsing = $true
        }

        if ($Body -and $Method -ne "GET") {
            $params.Body = ($Body | ConvertTo-Json)
            $params.Headers = @{"Content-Type" = "application/json"}
        }

        $response = Invoke-WebRequest @params
        $status = $response.StatusCode

        Write-Host "  ✅ SUCCESS ($status)" -ForegroundColor Green

        # Show response preview
        if ($response.Content) {
            $preview = $response.Content.Substring(0, [Math]::Min(200, $response.Content.Length))
            Write-Host "  Response: $preview..." -ForegroundColor Gray
        }

    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        Write-Host "  ❌ FAILED ($status)" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }

    Write-Host ""
}

# Test 1: Server Running
Test-API -Name "Homepage" -Url "$baseUrl/"

# Test 2: List Drivers
Test-API -Name "List All Drivers" -Url "$baseUrl/api/drivers"

# Test 3: Time Slots
$tomorrow = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
Test-API -Name "Get Time Slots" -Url "$baseUrl/api/slots?date=$tomorrow"

# Test 4: Permits
Test-API -Name "List Permits" -Url "$baseUrl/api/permits"

# Test 5: New Driver Jobs Endpoint
Test-API -Name "Driver Active Jobs (NEW)" -Url "$baseUrl/api/driver/jobs/active?driver_id=test-driver-id"

# Test 6: Organization Login
Test-API -Name "Organization Login" `
    -Url "$baseUrl/api/org/auth/login" `
    -Method "POST" `
    -Body @{
        email = "manager@smsa.com"
        password = "demo1234"
    }

# Test 7: Create Job (will fail without auth, but endpoint should exist)
Test-API -Name "Create Job (No Auth)" `
    -Url "$baseUrl/api/org/jobs/create" `
    -Method "POST" `
    -Body @{
        customer_name = "Test Customer"
        cargo_type = "STANDARD"
        pickup_location = "Dammam Port"
        destination = "Riyadh"
        preferred_date = $tomorrow
        preferred_time = "10:00"
        container_count = 1
    }

# Test 8: Traffic Update (Team 3)
Test-API -Name "Traffic Update (Team 3)" `
    -Url "$baseUrl/api/traffic" `
    -Method "POST" `
    -Body @{
        camera_id = "TEST_CAM_01"
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        status = "MODERATE"
        vehicle_count = 100
        truck_count = 10
    }

# Test 9: GPS Location
Test-API -Name "Submit GPS Location" `
    -Url "$baseUrl/api/locations" `
    -Method "POST" `
    -Body @{
        driver_id = "test-driver-id"
        latitude = 26.3927
        longitude = 50.0888
        speed = 45.5
        heading = 180
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    }

Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "   Testing Complete!" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Check results above" -ForegroundColor White
Write-Host "2. Test organization portal: http://localhost:3000/org-login" -ForegroundColor White
Write-Host "3. Login: manager@smsa.com / demo1234" -ForegroundColor White
Write-Host "4. Create a job and test auto-assign" -ForegroundColor White
