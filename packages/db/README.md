# packages/db

This package contains the Prisma database schema and related utilities for the SecureBananaLabs monorepo.

## Prisma Schema

The Prisma schema is located at `packages/db/prisma/schema.prisma`. This file defines all database models, enums, and relations used across the application.

## Available Scripts

This package provides the following npm scripts:

- `generate`: Generates Prisma client based on the schema
  ```bash
  npm run generate -w packages/db
  ```
  
- `migrate`: Manages database migrations
  ```bash
  npm run migrate -w packages/db
  ```

## Database Models

The schema defines the following models:

- `User`: Represents user accounts in the system
- `Job`: Represents job postings created by clients
- `Proposal`: Represents proposals submitted by freelancers for jobs
- `Payment`: Represents payment transactions
- `Review`: Represents reviews given by users after completing jobs
- `Message`: Represents messages between users in the messaging system
- `Category`: Represents job categories
- `Skill`: Represents skills that users can have
- `Notification`: Represents system notifications sent to users

## Enums

The schema defines the following enums:

- `UserRole`: Defines possible user roles (e.g., CLIENT, FREELANCER, ADMIN)
- `JobStatus`: Defines possible job statuses (e.g., OPEN, IN_PROGRESS, COMPLETED, CANCELLED)