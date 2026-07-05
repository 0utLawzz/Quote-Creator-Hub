# Quote Creator Hub

> Design, animate and export beautiful quote reels for social media.

A full-stack monorepo featuring an Express API, a React/Vite frontend (Reel Studio), and a PostgreSQL database via [Neon](https://neon.tech). Deployable to [Vercel](https://vercel.com).

---

## Table of Contents

- [Stack](#stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Database](#database)
- [Building](#building)
- [Deployment](#deployment)
  - [Frontend → Vercel](#frontend--vercel)
  - [Database → Neon](#database--neon)
- [GitHub Actions CI](#github-actions-ci)
- [Contributing](#contributing)

---

## Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Runtime    | Node.js 24, TypeScript 5.9          |
| Package manager | pnpm workspaces                |
| Frontend   | React 19, Vite 7, TailwindCSS 4     |
| Backend    | Express 5, pino logger              |
| Database   | PostgreSQL (Neon) + Drizzle ORM     |
| Validation | Zod v4, drizzle-zod                 |
| Deployment | Vercel (frontend), Neon (DB)        |

---

## Project Structure

```
Quote-Creator-Hub/
├── artifacts/
│   ├── api-server/        # Express 5 backend (port 5000)
│   ├── reel-studio/       # React + Vite frontend (port 3000)
│   └── mockup-sandbox/    # Standalone Vite design sandbox
├── lib/
│   ├── db/                # Drizzle ORM schema + migrations
│   ├── api-spec/          # OpenAPI specification
│   ├── api-zod/           # Auto-generated Zod schemas
│   └── api-client-react/  # Auto-generated React Query hooks
├── scripts/               # Workspace-level scripts
├── .env.example           # Environment variable template
├── vercel.json            # Vercel deployment config
└── pnpm-workspace.yaml    # Monorepo workspace config
```

---

## Prerequisites

- **Node.js** ≥ 24 ([download](https://nodejs.org))
- **pnpm** ≥ 9 — install with `npm install -g pnpm`
- **Neon** account + project — [neon.tech](https://neon.tech) (free tier available)
- **Vercel** account — [vercel.com](https://vercel.com) (optional, for deployment)

---

## Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/0utLawzz/Quote-Creator-Hub.git
cd Quote-Creator-Hub

# 2. Copy environment variables
cp .env.example .env
# Edit .env and add your DATABASE_URL from Neon

# 3. Install dependencies
pnpm install

# 4. Push the DB schema (first time only)
pnpm db:push
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

| Variable       | Description                          | Required |
|----------------|--------------------------------------|----------|
| `DATABASE_URL`  | Neon Postgres connection string      | ✅ Yes   |
| `NODE_ENV`      | `development` or `production`        | No       |
| `PORT`          | API server port (default: `5000`)    | No       |

> ⚠️ **Never commit `.env`** — it is in `.gitignore`.

---

## Development

Run the API server and frontend in separate terminals:

```bash
# Terminal 1 — API server (http://localhost:5000)
pnpm dev:api

# Terminal 2 — Frontend (http://localhost:3000)
pnpm dev:ui
```

The Vite dev server proxies `/api/*` requests to `http://localhost:5000` automatically.

---

## Database

```bash
# Push schema changes to your Neon DB
pnpm db:push

# Full typecheck across all packages
pnpm typecheck

# Regenerate API hooks and Zod schemas from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen
```

---

## Building

```bash
# Typecheck + build all packages
pnpm build

# Build only the frontend
pnpm --filter @workspace/reel-studio run build

# Build only the API server
pnpm --filter @workspace/api-server run build
```

---

## Deployment

### Frontend → Vercel

```bash
# Log in to Vercel
pnpm vercel:login

# Link this project (first time)
vercel link

# Deploy to production
pnpm vercel:deploy
```

The `vercel.json` in the root configures the build automatically.

### Database → Neon

```bash
# Log in to Neon CLI
pnpm neon:login

# Create a new Neon project (if needed)
neonctl projects create --name quote-creator-hub

# List your connection strings
neonctl connection-string --project-id <your-project-id>
```

---

## GitHub Actions CI

A CI workflow runs on every push and pull request:
- TypeScript typecheck across all packages
- Build validation

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow, branch strategy, and PR guidelines.

---

## License

MIT — see [LICENSE](LICENSE).
