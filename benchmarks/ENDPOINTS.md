# API benchmark endpoint inventory

The manifest in [scenarios.mjs](scenarios.mjs) covers **20 HTTP method and route combinations** mounted under `/api/`. Routes are normalized without trailing slashes. The separate `GET /health` readiness check is outside this inventory. The source of truth is [the Express application](../apps/api/src/app.js), its [route modules](../apps/api/src/routes), [controllers](../apps/api/src/controllers), [services](../apps/api/src/services), and [validators](../apps/api/src/validators).

Every scenario requires the listed HTTP status, a JSON envelope with `success === true`, and a scenario-specific check of `envelope.data`. Status alone is insufficient. Only `/api/admin/metrics` currently installs authentication middleware; the other 19 operations are public in the current code. The benchmark supplies a dedicated JWT only to that protected route.

| Scenario | Method and normalized route | Status | Request and semantic response check |
| --- | --- | --- | --- |
| `auth-register` | `POST /api/auth/register` | 201 | Synthetic `benchmark.client@example.invalid` email, ephemeral password, and lowercase `client` role. Require a generated user ID, that email and role, and a nonempty JWT with the expected client claims. |
| `auth-login` | `POST /api/auth/login` | 200 | The same synthetic email and ephemeral password. Require that email and a JWT for the current `usr_existing` client identity. |
| `auth-oauth` | `GET /api/auth/oauth/:provider/callback` | 200 | Concrete path `/api/auth/oauth/github/callback?code=benchmark-code&state=benchmark-state`. Require `provider: "github"` and `status: "callback-received"`. |
| `auth-refresh` | `POST /api/auth/refresh` | 200 | Empty JSON object, matching the current body-independent implementation. Require a JWT for the current `usr_existing` client identity. |
| `users-list` | `GET /api/users` | 200 | Seed through `users-create`; require a nonempty array of generated IDs and expected synthetic profile fields. |
| `users-create` | `POST /api/users` | 201 | Freelancer profile with a sequence-specific `@example.invalid` email, full name, bio, uppercase `FREELANCER` role, verification flag, and two skills. Require the generated ID and those fields. |
| `jobs-list` | `GET /api/jobs` | 200 | Seed through `jobs-create`; require a nonempty array of the expected dashboard jobs with generated IDs and lowercase `open` status. |
| `jobs-create` | `POST /api/jobs` | 201 | Dashboard title, approximately 1 KiB description, 3500–6500 budget range, category reference, and three skills. Require those fields, a generated ID, and `status: "open"`. |
| `proposals-list` | `GET /api/proposals` | 200 | Seed through `proposals-create`; require a nonempty array of the expected proposal fields and generated IDs. |
| `proposals-create` | `POST /api/proposals` | 201 | Approximately 1 KiB cover letter, a 4250 bid, a three-week estimate, and synthetic job/freelancer references. Require those fields and a generated ID. |
| `payments-create` | `POST /api/payments` | 201 | Synthetic job reference, numeric amount `4250`, and currency `usd`. Require a generated payment ID, the same amount/currency, and `provider: "stripe"`. |
| `reviews-list` | `GET /api/reviews` | 200 | Seed through `reviews-create`; require a nonempty array of the expected reviews and generated IDs. |
| `reviews-create` | `POST /api/reviews` | 201 | Five-star rating, substantive delivery feedback, and distinct synthetic reviewer/reviewee references. Require those fields and a generated ID. |
| `messages-list` | `GET /api/messages` | 200 | Seed through `messages-create`; require a nonempty array of the expected messages, generated IDs, and valid ISO timestamps. |
| `messages-create` | `POST /api/messages` | 201 | Approximately 256-byte handoff message with distinct synthetic sender/receiver references. Require those fields, a generated ID, and a valid `sentAt` timestamp. |
| `notifications-list` | `GET /api/notifications` | 200 | Seed through `notifications-create`; require a nonempty array of the expected notifications, generated IDs, and `read: false`. |
| `notifications-create` | `POST /api/notifications` | 201 | Synthetic recipient, milestone review title, and substantive body. Require those fields, a generated ID, and `read: false`. |
| `uploads-create` | `POST /api/uploads` | 201 | A real `multipart/form-data` request with field `file`, filename `document.txt`, and the approximately 8 KiB [text fixture](fixtures/document.txt). Require `status: "uploaded"` and `filename: "document.txt"`. |
| `search` | `GET /api/search` | 200 | Concrete path `/api/search?q=accessibility%20dashboard`. Require the decoded query and the current stub's empty `users`, `jobs`, and `freelancers` arrays. |
| `admin-metrics` | `GET /api/admin/metrics` | 200 | Dedicated JWT in `Authorization: Bearer …`; no request body. Require the current static values: 42 open jobs, 185 active freelancers, 3 flagged accounts, and monthly volume 128900. |

## Fixture and seeding contract

`build({ token, password, sequence })` returns fresh request headers and a JSON string, multipart `Buffer`, or undefined body. JSON requests include `Content-Type: application/json`; multipart requests declare the matching boundary. `path` contains the concrete URL path and query. `route` retains route parameters for inventory comparisons. `validate(data)` returns a boolean and expects the already-decoded `envelope.data`, after the runner checks HTTP status and the success envelope.

Each of the six list scenarios declares `seedWith` for its corresponding create scenario. The runner sends three seed requests before the list's preflight, warmup, and measured requests. A list validator checks every returned item and rejects an empty array; it does not require an exact length. This prevents a fast empty collection from masquerading as a representative read while allowing valid collections to grow.

All email addresses use `example.invalid`. Relationships use descriptive synthetic references such as `benchmark_job_001` and `benchmark_freelancer_001`. The benchmark passes the password and JWT in memory; fixtures and documentation contain neither credential. The JWT validator checks encoding, header shape, identity/role claims, and issuance/expiration fields. It does not independently verify the returned signature; the protected metrics request exercises the application's JWT verification middleware.

The upload fixture is a substantive synthetic project brief. The focused tests decode the constructed multipart request and compare the complete file bytes. They also call the actual upload endpoint with an empty JSON body: the current controller returns HTTP 201 with `status: "no-file"`, which the scenario correctly rejects. Sending the actual document must produce the expected uploaded filename and status.

## What the current implementation measures

The [Prisma schema](../packages/db/prisma/schema.prisma) supplies realistic field names, but the API does not currently persist these records through Prisma. Users, jobs, proposals, reviews, messages, and notifications live in process-local arrays. Synthetic relationship references therefore do not exercise foreign-key lookups. Generated IDs use timestamp prefixes; the benchmark checks their current shape without assuming uniqueness.

Current API conventions differ from the database schema. Authentication accepts lowercase `client`, `freelancer`, and `admin`, while Prisma `UserRole` values are uppercase. The job controller accepts only the fields in its Zod schema, including a skills array; it strips fields such as `clientId` and returns lowercase `open`, while Prisma's job enum uses `OPEN`. The payment service uses lowercase `usd` by default, while the Prisma default is `USD`. The scenario payloads follow the current route contracts and document these differences rather than changing application behavior.

Registration and login are stubs: they issue tokens without persisting users or checking a stored password hash. Reusing the fixed synthetic auth email is valid for this implementation. Login returns no separate role field, so its client role is checked in the JWT claims. Refresh does not validate a refresh token, and the OAuth callback does not exchange or verify its synthetic code/state. Admin middleware validates a JWT but does not enforce an administrator role.

Payments return a placeholder response without a Stripe request. Search returns empty arrays without querying or ranking database records. Admin metrics are constants. Uploads use Multer memory storage and return the received filename/status without storing a file. The measurements therefore describe the current Express handlers, JSON and multipart parsing, JWT work, and in-memory operations; they do not establish production database, payment, OAuth, search, or object-storage performance.
