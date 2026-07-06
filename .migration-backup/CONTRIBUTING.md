# Contributing to Quote Creator Hub

Thank you for contributing! This guide covers how to set up the project locally, the branching strategy, and the PR process.

---

## Table of Contents

- [Development Setup](#development-setup)
- [Branch Strategy](#branch-strategy)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Workspace Commands](#workspace-commands)

---

## Development Setup

Follow the [Local Setup](README.md#local-setup) section in the README first. After that:

```bash
# Install dependencies (run from root)
pnpm install

# Verify everything typechecks
pnpm typecheck

# Start dev servers (separate terminals)
pnpm dev:api   # API at http://localhost:5000
pnpm dev:ui    # Frontend at http://localhost:3000
```

---

## Branch Strategy

| Branch        | Purpose                                      |
|---------------|----------------------------------------------|
| `main`        | Production-ready code. Protected.            |
| `dev`         | Integration branch for features              |
| `feat/<name>` | New feature branches — branch off `dev`      |
| `fix/<name>`  | Bug fix branches — branch off `dev`          |
| `chore/<name>`| Maintenance, deps, tooling — branch off `dev`|

```bash
# Always branch from dev
git checkout dev
git pull origin dev
git checkout -b feat/my-feature
```

---

## Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

Types: feat | fix | chore | docs | style | refactor | test | ci
Scope: api | ui | db | lib | ci | deps (optional)

Examples:
  feat(ui): add quote export to PNG
  fix(api): handle null user in auth middleware
  chore(deps): update vite to 7.3.2
  docs: update README deployment section
```

---

## Pull Request Process

1. **Open a PR against `dev`** (not `main` directly)
2. Fill in the PR template with a description and testing notes
3. Ensure **CI passes** — typecheck and build must be green
4. Request a review from a maintainer
5. Squash-merge after approval

---

## Code Style

- **TypeScript** — strict mode, no `any`
- **Formatting** — Prettier (run `pnpm exec prettier --write .`)
- **Imports** — use `@/` alias for `src/` in frontend packages
- **Components** — functional components only, no class components

---

## Workspace Commands

```bash
# Full TypeScript typecheck
pnpm typecheck

# Build everything
pnpm build

# Push DB schema to Neon (dev only)
pnpm db:push

# Run frontend dev server
pnpm dev:ui

# Run API dev server
pnpm dev:api

# Regenerate API client from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Format all files
pnpm exec prettier --write .
```

---

## Reporting Issues

Use the GitHub issue templates:
- 🐛 [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md)
- ✨ [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md)
