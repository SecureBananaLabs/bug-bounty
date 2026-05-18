# Admin Panel

The admin panel is the operations console for account moderation, listing review, dispute handling, platform controls, and audit review.

## Access Model

The `/admin` page performs a server-side guard before rendering the console. It accepts a verified HS256 JWT from either:

- `freelanceflow_access_token` cookie
- `Authorization: Bearer <token>` header

The token must be signed with `JWT_SECRET` and include `role: "admin"` or `role: "ADMIN"`. The Express API repeats the same role check on every `/api/admin/*` route, so the page guard is not the only protection layer.

For local UI review, set `NEXT_PUBLIC_ADMIN_DEMO_MODE=true` and open `/admin?admin=true`. This only bypasses the page guard for the Next.js demo shell; admin API calls still require a valid admin token.

The client prefers live API data whenever `NEXT_PUBLIC_API_BASE_URL` and an admin token are present. Without those values it falls back to deterministic demo data so the interface can still be reviewed in isolation.

## API Routes

All admin routes require an access token with an admin role.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/metrics` | Summary counts and trust score distribution |
| `GET` | `/api/admin/users` | Server-side paginated users with search, role, status, and joined-date filters |
| `GET` | `/api/admin/users/:id` | User profile, active jobs, and dispute history |
| `PATCH` | `/api/admin/users/:id/status` | Suspend, reinstate, or ban a user |
| `GET` | `/api/admin/moderation/jobs` | Server-side paginated flagged listing queue |
| `PATCH` | `/api/admin/moderation/jobs/:id` | Approve, reject, or escalate a flagged listing |
| `GET` | `/api/admin/disputes` | Server-side paginated dispute queue |
| `GET` | `/api/admin/disputes/:id` | Full dispute thread, evidence, and transaction details |
| `PATCH` | `/api/admin/disputes/:id/ruling` | Rule for a client or freelancer, trigger refunds, or escalate |
| `GET` | `/api/admin/platform-controls` | Registration and job-posting control state |
| `PATCH` | `/api/admin/platform-controls/:key` | Toggle a platform control after explicit confirmation |
| `GET` | `/api/admin/audit-logs` | Server-side paginated, filterable append-only audit log |

## Audit Behavior

The admin service writes an audit entry for every account status change, listing moderation decision, dispute ruling, and platform control update. Each record stores the admin ID, action type, target type, target ID, summary, metadata, and timestamp.

The audit list is append-only from the route layer. Existing entries are never edited by an admin action; new actions are added to the front of the list for quick review.

The admin page uses the same API routes for table refreshes and mutations:

- User filters call `/api/admin/users` with `page`, `pageSize`, `search`, `role`, `status`, `joinedFrom`, and `joinedTo`.
- Moderation, dispute, and audit tables use server-side `page` and `pageSize` queries.
- User status, listing moderation, dispute ruling, and platform controls call the corresponding `PATCH` routes before refreshing metrics and audit data.
- If a mutation request fails, the page keeps the existing state and shows the API error instead of applying a local-only change.

## Local Verification

Run the API tests:

```bash
node --test apps/api/src/tests/*.test.js
```

Build the web app:

```bash
cd apps/web
node ../../node_modules/next/dist/bin/next build
```

Start the API:

```bash
PORT=4000 node apps/api/src/server.js
```

Start the web app in demo mode:

```bash
cd apps/web
NEXT_PUBLIC_ADMIN_DEMO_MODE=true NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:4000 node ../../node_modules/next/dist/bin/next dev -p 3000
```

Open `http://127.0.0.1:3000/admin?admin=true` for the UI demo. Add a valid admin JWT to `localStorage.freelanceflow_admin_token` when exercising live API-backed refreshes from the browser.

For a live API-backed production demo, build with the public API base set:

```bash
cd apps/web
NEXT_PUBLIC_ADMIN_DEMO_MODE=true NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:4000 node ../../node_modules/next/dist/bin/next build
NEXT_PUBLIC_ADMIN_DEMO_MODE=true NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:4000 node ../../node_modules/next/dist/bin/next start -p 3000
```

## Demo Artifacts

- Desktop baseline screenshot: `docs/assets/admin-panel-desktop.png`
- Desktop interaction screenshot: `docs/assets/admin-panel-after-actions.png`
- Mobile screenshot: `docs/assets/admin-panel-mobile.png`
- Recorded demo: `docs/assets/admin-panel-demo.webm`
