# @freelanceflow/db

Database package for the FreelanceFlow monorepo. It owns the [Prisma](https://www.prisma.io) schema and the generated Prisma client.

## Schema

The schema lives at `packages/db/prisma/schema.prisma` and targets PostgreSQL.

### Enums

| Enum | Values |
| :--- | :--- |
| `UserRole` | `CLIENT`, `FREELANCER`, `ADMIN` |
| `JobStatus` | `DRAFT`, `OPEN`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |

### Models

| Model | Description |
| :--- | :--- |
| `User` | Marketplace account with a role (`CLIENT`, `FREELANCER`, or `ADMIN`), profile fields, and relations to jobs, proposals, messages, reviews, and notifications. |
| `Job` | A posted freelance job with a budget range, status, and a client owner. |
| `Proposal` | A freelancer's bid on a job, including cover letter, amount, and estimated duration. |
| `Payment` | A payment record linked to a job, with amount, currency, and optional Stripe reference. |
| `Review` | A rating and comment left by a reviewer for a reviewee. |
| `Message` | A direct message between a sender and a receiver. |
| `Category` | Job category; referenced by jobs. |
| `Skill` | Skill tag; referenced by users. |
| `Notification` | Per-user notification with a title, body, and read flag. |

## Scripts

Run package scripts from the repo root with `npm run <script> -w packages/db`.

| Script | Command | Description |
| :--- | :--- | :--- |
| `generate` | `npm run generate -w packages/db` | Generate the Prisma client. |
| `migrate` | `npm run migrate -w packages/db` | Create and apply a development migration. |

The `DATABASE_URL` environment variable must be set before running Prisma commands.