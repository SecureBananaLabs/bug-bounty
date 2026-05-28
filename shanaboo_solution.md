I need to analyze this GitHub issue and produce a diff that fixes it. Let me parse the issue carefully.

The issue title is: "Low Hanging Fruit Automation"
Labels: bug, documentation, good first issue, bounty, AI agent friendly
Bounty: $700

The issue description is quite garbled, but I can extract key information:
1. It's about creating automation for "low hanging fruit" issues
2. Mentions "Pull requests without issues will not be considered"
3. Mentions "If you would like to work on it, please create another issue with the same contents and refer to this issue"
4. There's a bounty of $700 that can only be paid upon successful PR merge

Looking at the file structure and content:
- `apps/web` - Next.js 14 App Router frontend
- `packages/ui` - Shared UI components
- `apps/api` - Express backend with layered architecture
- `packages/db` - Prisma schema and database package
- `packages/auth` - Auth layer
- `packages/jobs` - Job listings and freelancer search
- `packages/messaging` - Messaging, notifications
- `packages/payments` - Payments (Stripe-focused service placeholder)
- `packages/admin` - Admin routes

The issue seems to be about automating the handling of "low hanging fruit" issues - likely documentation fixes, small bugs, etc.

Looking at the garbled text more carefully, I see references to:
- "Run frontend"
- "npm run dev -w apps/web"
- "npm run dev -w apps/api"
- Prisma schema
- `.env` files
- `package.json`
- `CONTRIBUTING.md`
- `.gitignore`

The most plausible interpretation: This is about **creating a GitHub issue template or automation workflow** for "low hanging fruit" issues, or perhaps it's about **setting up development environment documentation** (CONTRIBUTING.md) to help new contributors get started easily.

Given the labels "good first issue", "documentation", and the bounty context, the most likely fix is:

1. **Create a `CONTRIBUTING.md` file** with clear setup instructions
2. **Add GitHub issue templates** for low-hanging fruit issues
3. **Fix `.gitignore`** or environment setup issues

Looking at the garbled text: "Your task is to solve a real GitHub issue. You need to: 1. Understand the issue description thoroughly 2. Identify the root cause / required change 3. Write COMPLETE, production-quality code that fixes the issue 4. Output ONLY the file changes as ```diff ... ``` blocks in unified diff format"

And: "The diff MUST start with `--- a/<real_path>` and `+++ b/<real_path>` — the real file path MUST match an existing file in the repo (shown to you below)"

From the file list, I can see:
- `apps/web/package.json`
- `apps/api/package.json`  
- `packages/db/prisma/schema.prisma`
- `packages/auth/package.json`
- `packages/jobs/package.json`
- `packages/messaging/package.json`
- `packages/payments/package.json`
- `packages/admin/package.json`
- `CONTRIBUTING.md`
- `.gitignore`

The garbled text mentions: "npm run dev -w apps/web" and "npm run dev -w apps/api" which suggests the issue is about **workspace scripts** or **Turborepo/Monorepo configuration**.

Also mentions: "Each app/package expects its own `.env` values for db, auth, and integrations."

And: "Prisma schema is available in `packages/db/prisma/schema.prisma`"

The most common "low hanging fruit" in a monorepo with this structure is **missing root-level configuration** that makes it easy for new contributors to get started. This typically includes:

1. **Root `package.json`** with workspace scripts
2. **`CONTRIBUTING.md`** with setup instructions
3. **`.env.example` files** for each package

But since we need to produce a diff for EXISTING files, let me think about what file would most plausibly need changes.

Looking at the structure again, the issue mentions "Low Hanging Fruit Automation" - this could mean:
- GitHub Actions workflow to auto-label issues
- Issue templates
- Bot configuration

But the most "low hanging fruit" fix that matches the garbled description about "npm run dev" and environment setup is likely **adding a root `package.json` script** or **fixing the `CONTRIBUTING.md`** to document how to run things.

Wait - re-reading more carefully. The issue says "Low Hanging Fruit Automation" and mentions "Pull requests without issues will not be considered." This sounds like it's about **automating the creation or management of "good first issue" / "low hanging fruit" issues**.

However, the most concrete technical need from the garbled text is:
- "npm run dev -w apps/web" 
- "npm run dev -w apps/api"
- "Each app/package expects its own `.env` values"

This suggests the issue is: **The repository lacks a proper root-level setup script or CONTRIBUTING guide that explains the monorepo structure and how to run apps.**

Given the instruction "Write COMPLETE, production-quality code that fixes the issue" and "Output ONLY the file changes as ```diff ... ``` blocks", I need to identify the most likely file to change.

The most impactful "low hanging fruit" for a new open-source project is typically:
1. **Adding a `CONTRIBUTING.md`** - but this might be a new file
2. **Adding root `package.json` scripts** - but we need to see if root package.json exists

Actually, looking at typical "good first issue" / "low hanging fruit" automation - this might be about **adding a GitHub Action** or **issue template**. But those would be new files.

Wait - the user says "Patch must apply cleanly" and "Do NOT invent new paths". So I must only modify existing files shown.

Let me re-examine: The issue title is "Low Hanging Fruit Automation". In many repos, this refers to automating dependency updates, formatting, or other maintenance tasks. But with the context given...

Actually, I think the most likely scenario given the extreme garbling is that this is about **creating or fixing a `CONTRIBUTING.md` file** that documents the monorepo setup, since the garbled text repeatedly mentions npm commands, .env files, and the file list includes `CONTRIBUTING.md`.

Or, it's about **fixing workspace configuration** in root `package.json` to add proper dev scripts.

But I don't see `package.json` at root in the file list. Let me check what files are shown:
- `apps/web/package.json`
- `apps/api/package.json`
- `packages/db/prisma/schema.prisma`
- `packages/auth/package.json`
- `packages/jobs/package.json`
- `packages/messaging/package.json`
- `packages/payments/package.json`
- `packages/admin/package.json`
- `CONTRIBUTING.md`
- `.gitignore`

Hmm, `CONTRIBUTING.md` is listed. Let me assume the issue is about **updating `CONTRIBUTING.md`**