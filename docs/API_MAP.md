# API Map

## Auth
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh

## Jobs
GET  /api/jobs
POST /api/jobs (auth)
GET  /api/jobs/:id

## Proposals
GET  /api/proposals (auth)
POST /api/proposals (auth)

## Architecture
web:3000 -> api:4000 -> db (SQLite/Prisma)
