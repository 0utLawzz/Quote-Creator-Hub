# Windows equivalent of post-merge.sh
# Run after pulling/merging to sync dependencies and DB schema

Write-Host "Running post-merge setup..." -ForegroundColor Cyan

# Install dependencies
pnpm install --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw "pnpm install failed" }

# Push DB schema changes (dev only — requires DATABASE_URL in .env)
pnpm --filter @workspace/db run push
if ($LASTEXITCODE -ne 0) { throw "DB push failed" }

Write-Host "Post-merge complete!" -ForegroundColor Green
