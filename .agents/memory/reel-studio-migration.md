---
name: Reel Studio migration
description: Notes on how the Vercel import was ported to Replit — the app was already a pnpm workspace, so no Next.js conversion was needed.
---

# Reel Studio — Vercel → Replit migration

## Key fact
The imported project was NOT a Next.js app. It was already a Vite + React + Express pnpm workspace identical to the Replit scaffold. No framework conversion was required.

## What was done
1. Copied `artifacts/reel-studio/` from `.migration-backup/` into the workspace (`artifacts/reel-studio/`)
2. Copied lib packages: `api-spec/openapi.yaml`, `api-zod/src/`, `api-client-react/src/`, `db/src/schema/`, `db/drizzle.config.ts`
3. Copied `artifacts/api-server/src/routes/` (quotes, reels, schedules, social, templates)
4. Updated `artifacts/api-server/package.json`: added `cross-env` + `tsx` devDeps, changed dev script to `cross-env NODE_ENV=development tsx watch src/index.ts`
5. Removed Vite proxy (`/api → localhost:5000`) from `artifacts/reel-studio/vite.config.ts` — shared proxy handles this
6. Added `cross-env` to `pnpm-workspace.yaml` catalog
7. Ran `pnpm --filter @workspace/db run push` to create tables (reels, schedules, connections)

**Why:** Replit's shared proxy routes `/api` to the API server; a Vite-level proxy is redundant and incorrect.

## App
- **Name:** Reel Studio — quote reel creator for social media
- **Frontend:** `artifacts/reel-studio/` at previewPath `/`
- **API:** `artifacts/api-server/` at `/api` (port 8080)
- **DB tables:** `reels`, `schedules`, `connections`
- **Frontend port:** 21533
