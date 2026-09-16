# Securitask

Securitask is a modular finance and operations management system for a security company. The current implementation establishes the Phase 1 security foundation: database-backed users, dynamic roles and permissions, JWT authentication, and append-only audit logging.

## Prerequisites

- Node.js 22+
- Corepack (`corepack enable`)
- PostgreSQL 15+

## Local setup

1. Copy `backend/.env.example` to `backend/.env`.
2. Set `DATABASE_URL`, a unique `JWT_SECRET` of at least 32 characters, and a secure `SEED_ADMIN_PASSWORD`.
3. Install dependencies with `corepack pnpm install`.
4. Create the database schema with `corepack pnpm --filter @securitask/backend db:migrate`.
5. Seed the protected Super Administrator account with `corepack pnpm --filter @securitask/backend db:seed`.
6. Start both applications with `corepack pnpm dev`.

The API runs on `http://localhost:4000` and exposes `GET /health`.

## Vercel deployment

Deploy the frontend and backend as two Vercel projects from the same repository:

1. Create an **API** project with `backend` as its Root Directory. Vercel uses `backend/api/[...path].ts` as the catch-all serverless function entry point; it exports the Express application and does not run `app.listen()`.
2. Add `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `BOOTSTRAP_ADMIN_EMAIL`, and `SEED_ADMIN_PASSWORD` to the API project's Vercel Environment Variables. Use the Neon pooled URL for `DATABASE_URL`.
3. Run Prisma migrations and seeding from a trusted environment that can reach Neon before the first deployment. Do not expose either database URL to the frontend.
4. Create a **frontend** project with `frontend` as its Root Directory. Set its `API_URL` environment variable to the deployed API project's URL, for example `https://securitask-api.vercel.app`.
5. Redeploy the frontend after setting `API_URL`; Next.js reads rewrites during its build.

## Phase 1 API

- `POST /api/auth/login` authenticates an active user and returns a JWT.
- `GET /api/auth/me` returns the current authenticated user.
- `/api/admin/permissions`, `/api/admin/roles`, and `/api/admin/users` are protected by database-managed permissions.

The seed grants the protected `Super Administrator` role every currently registered permission. Future modules extend this model by registering their own `module.action` permissions; no application role names are used for authorization decisions.
