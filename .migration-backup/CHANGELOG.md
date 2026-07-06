# Changelog

All notable changes to **Quote Creator Hub** are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- `README.md` — full project documentation (setup, dev, deployment)
- `CONTRIBUTING.md` — developer workflow guide
- `CHANGELOG.md` — this file
- `.env.example` — environment variable template for Neon DB
- `vercel.json` — Vercel deployment configuration
- `.github/workflows/ci.yml` — GitHub Actions typecheck + build CI
- `.github/ISSUE_TEMPLATE/` — bug report & feature request templates
- `scripts/post-merge.ps1` — Windows PowerShell equivalent of `post-merge.sh`
- Vercel CLI (`vercel`) and Neon CLI (`neonctl`) as devDependencies
- Root `pnpm` scripts: `dev:api`, `dev:ui`, `db:push`, `vercel:login`, `vercel:deploy`, `neon:login`

### Changed
- Migrated from Replit to local/Vercel + Neon deployment
- Removed bash-only `preinstall` script (Windows incompatible)
- Replaced Linux-only platform binary overrides in `pnpm-workspace.yaml`
- Stripped `@replit/*` plugins from `reel-studio` and `mockup-sandbox`
- Cleaned `vite.config.ts` — removed Replit watermark and runtime-error-modal plugins
- Updated `index.html` meta tags — removed "built on Replit" text

### Removed
- `.replit` — Replit environment config
- `.replitignore` — Replit deploy ignore file
- `replit.md` — replaced by `README.md`
- `@replit/vite-plugin-cartographer`
- `@replit/vite-plugin-dev-banner` (the "Made by Replit" watermark source)
- `@replit/vite-plugin-runtime-error-modal`

---

## [0.1.0] — 2026-07-05

### Added
- Initial Replit scaffold: pnpm workspace, Express 5 API, React 19 + Vite frontend
- Drizzle ORM schema with PostgreSQL
- OpenAPI spec + Orval codegen pipeline
- Reel Studio frontend with dashboard, create, library, schedule, templates, connect, strategy pages
