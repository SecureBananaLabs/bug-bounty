# Project
<img width="663" height="183" alt="Image" src="https://github.com/user-attachments/assets/1a920eb5-e581-44ce-bcef-2ebf0566777f" />

# FreelanceFlow Monorepo

FreelanceFlow is a full-stack freelance marketplace monorepo built with a modern TypeScript-first architecture.

## Workspace Structure

- `apps/web` — Next.js 14 App Router frontend
- `apps/api` — Express.js backend with layered REST API
- `packages/db` — Prisma schema and database package
- `packages/ui` — Shared UI components

## Frontend

The web app includes pages for:

- Landing
- Job listings and job detail
- Post a job
- Freelancer profiles and freelancer search
- Client and freelancer dashboards
- Messaging
- Notifications
- Settings
- Billing
- Admin panel

## Backend

The API includes:

- Auth routes (register, login, OAuth callback, JWT refresh)
- CRUD routes for users, jobs, and proposals
- Payments routes (Stripe-focused service placeholder)
- Reviews, messaging, notifications
- File uploads and search
- Admin routes

Backend architecture follows:

- Middleware layer (auth, rate limiting, error handling)
- Controller layer
- Service layer
- Route layer
- Validation schemas (Zod)
- Utility helpers

## Getting Started

```bash
npm install
npm run test
```

## AI Agent Contribution Instruction

- `packages/ui` --- Shared UI components

## Frontend
- Job listings and job detail
- Landing
- Post a job
- Job Search
- Freelancer profiles and freelancer search
- Client and freelancer dashboards

```bash
npm run dev -w apps/api
```

## Database

Prisma schema is available in `packages/db/prisma/schema.prisma` with models for:


## Getting Started

- Reviews
- Messages
- Categories
- Skills

## Environment Variables

Each app/package expects its own `.env` values for DB, auth, and integrations.
