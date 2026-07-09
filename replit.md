# Reel Studio

Create cinematic quote reels, manage them in a library, and publish to social media — web + mobile.

## Run & Operate

- `pnpm --filter @workspace/reel-studio run dev` — run the web frontend (preview path: `/`)
- `pnpm --filter @workspace/reel-studio-mobile run dev` — run the Expo mobile app (preview path: `/reel-studio-mobile/`)
- `pnpm --filter @workspace/api-server run dev` — run the API server (preview path: `/api`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (already set as a secret)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Web: React 19 + Vite 7 + shadcn/ui + Tailwind CSS 4
- Mobile: Expo 54 + React Native 0.81 + Expo Router
- API: Express 5 + Orval-generated React Query client
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle for the API)

## Where things live

- Web frontend: `artifacts/reel-studio/src/pages/`
- Mobile app: `artifacts/reel-studio-mobile/app/(tabs)/`
- API routes: `artifacts/api-server/src/routes/`
- DB schema: `lib/db/src/schema/`
- API spec & generated client: `lib/api-spec/openapi.yaml` and `lib/api-client-react/src/generated/`
- Shared theme: `artifacts/reel-studio/src/index.css` (web), `artifacts/reel-studio-mobile/constants/colors.ts` (mobile)

## Architecture decisions

- OpenAPI spec is the single source of truth for API types; client and server use generated types.
- Mobile uses the shared backend via `setBaseUrl` from `@workspace/api-client-react`, not local state.
- Status field (`draft`/`posted`/`scheduled`) is the source of truth for publish state across web and mobile.
- Bulk import supports CSV, JSON, and plain text with duplicate detection against the existing library.
- Video renderer is deterministic Canvas2D; all text effects derive from `ms` so export frames match the preview.

## Product

- Create single reels with quote, author, category, caption, and hashtags.
- Bulk import dozens of reels from CSV/JSON/plain text with optional default status.
- Mark reels as Posted or revert to Draft from the Library.
- View stats, recent reels, and library on the Dashboard.
- Mobile companion with Library, Create, and Bulk Import tabs.

## User preferences

- Cinematic dark-gold brand identity (charcoal + amber-gold) should be kept consistent across web and mobile.
- Font preference: Outfit for mobile, matching the web’s sans-serif headings.

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen` before the next typecheck.
- Mobile app needs `EXPO_PUBLIC_DOMAIN` to reach the API; it is injected by the managed workflow.
- `.migration-backup/artifacts/*` contains duplicate workflows from the GitHub import; they are not needed and may be removed.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
