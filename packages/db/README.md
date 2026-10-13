# Database package

`@freelanceflow/db` contains the Prisma schema and generated database client used by the monorepo. The schema lives at [`prisma/schema.prisma`](./prisma/schema.prisma) and targets PostgreSQL through the `DATABASE_URL` environment variable.

## Scripts

Run the package scripts from the repository root:

```bash
npm run generate -w packages/db
npm run migrate -w packages/db
```

- `generate` runs `prisma generate` to generate the Prisma client.
- `migrate` runs `prisma migrate dev` to create and apply development migrations.

## Schema overview

The current schema defines these models:

- `User`: account profile, role, skills, jobs, proposals, messages, reviews, and notifications.
- `Job`: client-posted work with budget, status, category, proposals, and payments.
- `Proposal`: a freelancer bid, cover letter, and estimated duration for a job.
- `Payment`: payment amount, currency, status, optional Stripe reference, and related job.
- `Review`: rating and comment connecting a reviewer and reviewee.
- `Message`: direct message between a sender and receiver with read state.
- `Category`: unique job category and its jobs.
- `Skill`: unique skill linked to users.
- `Notification`: user notification with title, body, and read state.

The schema also defines:

- `UserRole`: `CLIENT`, `FREELANCER`, `ADMIN`.
- `JobStatus`: `DRAFT`, `OPEN`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.

When changing the schema, regenerate the client and create an appropriate development migration before relying on the updated database types.