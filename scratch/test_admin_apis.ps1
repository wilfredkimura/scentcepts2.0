# PowerShell Script to Test all administrative REST endpoints of Scentcepts 2.0
$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:8080/api"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Scentcepts 2.0 Admin API Testing Script" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Sign In as Admin
Write-Host "`n[Step 1] Authenticating as admin@scentcepts.com..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@scentcepts.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/signin" -Method Post -ContentType "application/json" -Body $loginBody
    $token = $loginResponse.token
    Write-Host "Success! Token acquired." -ForegroundColor Green
    Write-Host "Token excerpt: $($token.Substring(0, 30))..." -ForegroundColor DarkGray
} catch {
    Write-Host "Failed to authenticate. Make sure the Spring Boot backend is fully started." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Construct Headers
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Helper function to invoke get request
function Test-GetEndpoint($path, $label) {
    Write-Host "`n[Test] Calling $label ($path)..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl$path" -Method Get -Headers $headers
        Write-Host "Success! Response code: 200 OK" -ForegroundColor Green
        Write-Host "Result Sample: $(ConvertTo-Json $response | Select-Object -First 6)" -ForegroundColor Gray
    } catch {
        Write-Host "Failed! Path $path returned an error:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

# 2. Test users list
Test-GetEndpoint "/auth/admin/users" "Admin Users List"

# 3. Test orders list
Test-GetEndpoint "/auth/admin/orders" "Admin Orders List"

# 4. Test transactions list
Test-GetEndpoint "/auth/admin/transactions" "Admin Transactions List"

# 5. Test creating a new perfume via Admin Route
Write-Host "`n[Test] Creating a test perfume via POST /api/perfumes..." -ForegroundColor Yellow
$perfumeBody = @{
    name = "Test Oud Supreme"
    brand = "Antigravity Luxury"
    price = 189.99
    stockCount = 15
    description = "A complex woody aroma designed for verification testing."
} | ConvertTo-Json

try {
    $perfumeResponse = Invoke-RestMethod -Uri "$baseUrl/perfumes" -Method Post -Headers $headers -Body $perfumeBody
    Write-Host "Success! Perfume created." -ForegroundColor Green
    Write-Host "Created Perfume details: ID=$($perfumeResponse.id), Name=$($perfumeResponse.name), Brand=$($perfumeResponse.brand)" -ForegroundColor Gray
} catch {
    Write-Host "Failed to create perfume via admin POST route:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "Admin Endpoint Verification Complete!" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
