$ErrorActionPreference = "Stop"

$services = @(
  "user-service",
  "product-service",
  "order-service",
  "payment-service",
  "review-service",
  "blog-service"
)

foreach ($service in $services) {
  Write-Host "Seeding $service..."
  Push-Location (Join-Path $PSScriptRoot $service)
  try {
    npm run seed
  } finally {
    Pop-Location
  }
}

Write-Host "Seed completed."
