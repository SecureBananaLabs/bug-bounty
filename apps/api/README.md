# FreelanceFlow API

Express.js backend for the FreelanceFlow monorepo. This document is a reference for every route exposed by the API and matches the current implementation.

## Stack

- Express 4
- Zod 3 (request validation)
- `jsonwebtoken` (JWT access tokens)
- `express-rate-limit` (global rate limiting)
- `helmet` + `cors`
- `multer` (in-memory file uploads)

## Getting Started

```bash
npm install
npm run dev -w apps/api   # or: npm start -w apps/api
```

The server boots on `http://localhost:4000` by default (`PORT`).

### Environment Variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `4000` | HTTP listen port |
| `NODE_ENV` | `development` | Runtime environment |
| `JWT_SECRET` | `development-secret` | Secret used to sign/verify access tokens |
| `STRIPE_SECRET_KEY` | *(empty)* | Reserved for Stripe integration |
| `DATABASE_URL` | *(empty)* | Reserved for Prisma/PostgreSQL |

### Running Tests

```bash
npm run test -w apps/api
```

Tests use Node's built-in test runner (`node --test src/tests`).

## Global Behavior

- Every request passes through `helmet`, `cors`, `express.json`, and a global rate limiter (200 requests per 15 minutes per IP).
- Successful responses use the envelope `{ "success": true, "data": ... }`.
- Failure responses use the envelope `{ "success": false, "message": "..." }`.
- Unhandled errors (including Zod validation errors thrown by controllers) are caught by the global error handler and returned as `500 { "success": false, "message": "Unexpected server error" }`.
- Auth-protected routes expect an `Authorization: Bearer <jwt>` header. Access tokens are signed with `expiresIn: "15m"`.
- Most data lives in in-memory arrays in the service layer; there is no database persistence yet (`connectDb()` is a placeholder).

## Endpoints

### `GET /health`

Public health check.

Response `200`:

```json
{ "ok": true, "service": "api" }
```

### Auth — `/api/auth`

#### `POST /api/auth/register`

Public. Creates a user and returns a JWT.

Request body:

| Field | Type | Rules |
| --- | --- | --- |
| `email` | string | must be a valid email |
| `password` | string | minimum 8 characters |
| `role` | string | `client`, `freelancer`, or `admin` (default `client`) |

Response `201`:

```json
{
  "success": true,
  "data": {
    "id": "usr_...",
    "email": "user@example.com",
    "role": "client",
    "token": "<jwt>"
  }
}
```

#### `POST /api/auth/login`

Public. Returns a JWT.

Request body:

| Field | Type | Rules |
| --- | --- | --- |
| `email` | string | must be a valid email |
| `password` | string | minimum 8 characters |

Response `200`:

```json
{
  "success": true,
  "data": { "email": "user@example.com", "token": "<jwt>" }
}
```

#### `GET /api/auth/oauth/:provider/callback`

Public. Placeholder OAuth callback; echoes the provider.

Response `200`:

```json
{
  "success": true,
  "data": { "provider": "google", "status": "callback-received" }
}
```

#### `POST /api/auth/refresh`

Public. Returns a fresh access token.

Response `200`:

```json
{ "success": true, "data": { "token": "<jwt>" } }
```

### Users — `/api/users`

#### `GET /api/users`

Public. Returns all in-memory users.

Response `200`: `{ "success": true, "data": [...] }`

#### `POST /api/users`

Public. Creates an in-memory user. The body is not validated and is spread into the stored record.

Response `201`: `{ "success": true, "data": { "id": "usr_...", ...body } }`

### Jobs — `/api/jobs`

#### `GET /api/jobs`

Public. Returns all in-memory jobs.

Response `200`: `{ "success": true, "data": [...] }`

#### `POST /api/jobs`

Public. Creates a job.

Request body:

| Field | Type | Rules |
| --- | --- | --- |
| `title` | string | minimum 4 characters |
| `description` | string | minimum 10 characters |
| `budgetMin` | number | must be non-negative |
| `budgetMax` | number | must be non-negative |
| `categoryId` | string | minimum 1 character |
| `skills` | string[] | optional; each entry minimum 1 character |

Response `201`:

```json
{
  "success": true,
  "data": { "id": "job_...", "status": "open", ...body }
}
```

### Proposals — `/api/proposals`

#### `GET /api/proposals`

Public. Returns all in-memory proposals.

Response `200`: `{ "success": true, "data": [...] }`

#### `POST /api/proposals`

Public. Creates an in-memory proposal. The body is not validated.

Response `201`: `{ "success": true, "data": { "id": "prp_...", ...body } }`

### Payments — `/api/payments`

#### `POST /api/payments`

Public. Creates a payment intent (Stripe placeholder).

Request body:

| Field | Type | Default |
| --- | --- | --- |
| `amount` | number | required |
| `currency` | string | `"usd"` |

Response `201`:

```json
{
  "success": true,
  "data": {
    "paymentId": "pay_...",
    "amount": 100,
    "currency": "usd",
    "provider": "stripe"
  }
}
```

### Reviews — `/api/reviews`

#### `GET /api/reviews`

Public. Returns all in-memory reviews.

Response `200`: `{ "success": true, "data": [...] }`

#### `POST /api/reviews`

Public. Creates an in-memory review. The body is not validated.

Response `201`: `{ "success": true, "data": { "id": "rev_...", ...body } }`

### Messages — `/api/messages`

#### `GET /api/messages`

Public. Returns all in-memory messages.

Response `200`: `{ "success": true, "data": [...] }`

#### `POST /api/messages`

Public. Creates an in-memory message with a server-set `sentAt` timestamp.

Response `201`:

```json
{
  "success": true,
  "data": { "id": "msg_...", ...body, "sentAt": "2026-01-01T00:00:00.000Z" }
}
```

### Notifications — `/api/notifications`

#### `GET /api/notifications`

Public. Returns all in-memory notifications.

Response `200`: `{ "success": true, "data": [...] }`

#### `POST /api/notifications`

Public. Creates an in-memory notification. `read` defaults to `false`.

Response `201`:

```json
{
  "success": true,
  "data": { "id": "ntf_...", "read": false, ...body }
}
```

### Uploads — `/api/uploads`

#### `POST /api/uploads`

Public. Accepts a single file part named `file` (multipart/form-data, in-memory storage).

- With a file: response `201` `{ "success": true, "data": { "filename": "report.pdf", "status": "uploaded" } }`
- Without a file: response `201` `{ "success": true, "data": { "filename": null, "status": "no-file" } }`

### Search — `/api/search`

#### `GET /api/search?q=<query>`

Public. Placeholder search. `q` is optional and defaults to an empty string.

Response `200`:

```json
{
  "success": true,
  "data": { "query": "design", "users": [], "jobs": [], "freelancers": [] }
}
```

### Admin — `/api/admin`

All admin routes require a valid JWT. A missing header returns `401 { "success": false, "message": "Unauthorized" }`; an invalid token returns `401 { "success": false, "message": "Invalid token" }`.

#### `GET /api/admin/metrics`

Requires `Authorization: Bearer <jwt>`.

Response `200`:

```json
{
  "success": true,
  "data": {
    "openJobs": 42,
    "activeFreelancers": 185,
    "flaggedAccounts": 3,
    "monthlyVolume": 128900
  }
}
```