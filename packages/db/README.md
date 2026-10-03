# packages/db

This package contains the Prisma database schema and related utilities for the SecureBananaLabs monorepo.

## Prisma Schema

The Prisma schema is located at `packages/db/prisma/schema.prisma`. This file defines the database models and enums used throughout the application.

## Available Scripts

This package provides the following npm scripts:

- `generate`: Generates Prisma client
  ```bash
  npm run generate -w packages/db
  ```

- `migrate`: Manages database migrations
  ```bash
  npm run migrate -w packages/db
  ```

## Data Models

The schema defines the following models:

- **User**: Represents users in the system
- **Job**: Represents job postings
- **Proposal**: Represents job proposals submitted by freelancers
- **Payment**: Represents payment transactions
- **Review**: Represents reviews of users and services
- **Message**: Represents messages between users
- **Category**: Represents job categories
- **Skill**: Represents skills that users can have
- **Notification**: Represents system notifications

## Enums

The schema defines the following enums:

- **UserRole**: Defines possible user roles (e.g., CLIENT, FREELANCER)
- **JobStatus**: Defines possible job statuses (e.g., OPEN, IN_PROGRESS, COMPLETED)

## Usage

To use this package in other parts of the application:

1. Import the Prisma client:
   ```typescript
   import { PrismaClient } from '@packages/db';
   ```

2. Use the models and enums in your type definitions and queries.