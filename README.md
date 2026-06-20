# Easy Property Management

Property management platform for furnished apartment rentals (short-term and long-term contracts).

## Phase 1 — Foundation (current)

- **Backend**: Node.js + Express + TypeScript + Prisma + PostgreSQL. JWT auth (access + refresh), RBAC middleware, standardized error responses. Models: `User`, `Building`, `Unit`, `AuditLog`.
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS. i18n (EN/AR) with RTL switching, Zustand store, protected routes, login page, sidebar/topbar layout.

## Getting started

```bash
cp .env.example .env
docker compose up --build
```

Or run locally without Docker:

```bash
# Backend
cd backend
npm install
cp ../.env.example .env   # point DATABASE_URL at your local Postgres
npx prisma migrate dev
npx prisma:seed  # or: npx tsx prisma/seed.ts
npm run dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Seeded super admin: `admin@epm.com` / `Admin@1234`.

See `CLAUDE.md`-style briefing (provided separately) for the full multi-phase roadmap.
