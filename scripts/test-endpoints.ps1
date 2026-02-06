# Test Script for Smart Logistics API Endpoints

$baseUrl = "http://localhost:3000"
$testDriverId = "123e4567-e89b-12d3-a456-426614174000"
$testDate = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Testing Smart Logistics API Endpoints" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: GET /api/slots
Write-Host "[1/5] Testing GET /api/slots?date=$testDate" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/slots?date=$testDate" -Method GET -ContentType "application/json"
    $slots = ($response.Content | ConvertFrom-Json).slots
    $slotId = $slots[0].id
    Write-Host "OK - Found $($slots.Count) slots" -ForegroundColor Green
    Write-Host "  Slot ID: $slotId" -ForegroundColor Gray
} catch {
    Write-Host "FAILED: $($_)" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 1

# Test 2: POST /api/book
Write-Host "`n[2/5] Testing POST /api/book" -ForegroundColor Yellow
$bookingBody = @{
    driver_id = $testDriverId
    slot_id = $slotId
    cargo_type = "MEDICAL"
    notes = "Test booking - urgent medical supplies"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/book" -Method POST -ContentType "application/json" -Body $bookingBody
    $permit = ($response.Content | ConvertFrom-Json).permit
    $permitId = $permit.id
    $qrCode = $permit.qr_code
    Write-Host "OK - Permit created" -ForegroundColor Green
    Write-Host "  Permit ID: $permitId" -ForegroundColor Gray
    Write-Host "  QR Code: $qrCode" -ForegroundColor Gray
    Write-Host "  Priority: $($permit.priority)" -ForegroundColor Gray
} catch {
    Write-Host "FAILED: $($_)" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 1

# Test 3: GET /api/permits
Write-Host "`n[3/5] Testing GET /api/permits?driver_id=$testDriverId" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/permits?driver_id=$testDriverId" -Method GET
    $permits = ($response.Content | ConvertFrom-Json).permits
    Write-Host "OK - Found $($permits.Count) permits" -ForegroundColor Green
    foreach ($p in $permits | Select-Object -First 3) {
        Write-Host "  - $($p.qr_code) | $($p.status) | $($p.priority)" -ForegroundColor Gray
    }
} catch {
    Write-Host "FAILED: $($_)" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 1

# Test 4: POST /api/locations
Write-Host "`n[4/5] Testing POST /api/locations" -ForegroundColor Yellow
$locationBody = @{
    driver_id = $testDriverId
    permit_id = $permitId
    latitude = 26.4207
    longitude = 50.0888
    speed = 45.5
    heading = 90
    eta_minutes = 15
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/locations" -Method POST -ContentType "application/json" -Body $locationBody
    $location = ($response.Content | ConvertFrom-Json).location
    Write-Host "OK - Location recorded" -ForegroundColor Green
    Write-Host "  Lat: $($location.latitude), Lng: $($location.longitude)" -ForegroundColor Gray
} catch {
    Write-Host "FAILED: $($_)" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 1

# Test 5: POST /api/traffic
Write-Host "`n[5/5] Testing POST /api/traffic (CONGESTED)" -ForegroundColor Yellow
$trafficBody = @{
    camera_id = "CAM_01_KING_ABDULAZIZ"
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    status = "CONGESTED"
    vehicle_count = 165
    truck_count = 18
    recommendation = "HALT_TRUCK_PERMITS"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/traffic" -Method POST -ContentType "application/json" -Body $trafficBody
    $result = $response.Content | ConvertFrom-Json
    Write-Host "OK - Traffic update processed" -ForegroundColor Green
    Write-Host "  Permits halted: $($result.permits_affected)" -ForegroundColor Gray
    Write-Host "  Permits protected: $($result.permits_protected)" -ForegroundColor Gray
} catch {
    Write-Host "FAILED: $($_)" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "All 5 endpoints tested successfully!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
