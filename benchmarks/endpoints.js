/**
 * The endpoints covered by the benchmark suite, with the payloads they are
 * exercised with.
 *
 * Every route declared under `apps/api/src/routes/` is here, enumerated from
 * the routers themselves rather than assumed from REST convention: an earlier
 * revision benchmarked `GET /api/payments`, `GET /api/uploads` and
 * `GET /api/admin`, none of which exist, and reported the resulting 404s as a
 * 100% error rate.
 *
 * Bodies match the zod validators in `apps/api/src/validators/`, so a request
 * is accepted rather than rejected at the door. Measuring a validation failure
 * measures the validator, not the endpoint.
 *
 * `auth: true` marks the routes behind `middleware/auth.js`; the runner signs a
 * dedicated benchmark token for those.
 */

/** A body big enough to be representative without being pathological. */
const jobDescription =
  "We need a senior engineer to migrate our billing service off the legacy " +
  "queue. The work is well scoped, the test suite is green, and the team is " +
  "available for questions during European working hours.";

export const endpoints = [
  { name: "health", method: "GET", path: "/health", auth: false },

  // auth — apps/api/src/routes/authRoutes.js
  { name: "auth:register", method: "POST", path: "/api/auth/register", auth: false,
    body: { email: "bench@example.com", password: "benchmark-password", role: "client" } },
  { name: "auth:login", method: "POST", path: "/api/auth/login", auth: false,
    body: { email: "bench@example.com", password: "benchmark-password" } },
  { name: "auth:refresh", method: "POST", path: "/api/auth/refresh", auth: false,
    body: { refreshToken: "benchmark-refresh-token" } },
  { name: "auth:oauth-callback", method: "GET", auth: false,
    path: "/api/auth/oauth/github/callback?code=benchmark-code" },

  // users
  { name: "users:list", method: "GET", path: "/api/users", auth: false },
  { name: "users:create", method: "POST", path: "/api/users", auth: false,
    body: { email: "bench-user@example.com", name: "Bench User", role: "freelancer" } },

  // jobs
  { name: "jobs:list", method: "GET", path: "/api/jobs", auth: false },
  { name: "jobs:create", method: "POST", path: "/api/jobs", auth: false,
    body: { title: "Migrate billing service", description: jobDescription,
            budgetMin: 3500, budgetMax: 6000, categoryId: "backend-engineering",
            skills: ["node", "postgres", "queues"] } },

  // proposals
  { name: "proposals:list", method: "GET", path: "/api/proposals", auth: false },
  { name: "proposals:create", method: "POST", path: "/api/proposals", auth: false,
    body: { jobId: "bench-job-id", coverLetter: jobDescription, bid: 4500 } },

  // payments — write-only router
  { name: "payments:create", method: "POST", path: "/api/payments", auth: false,
    body: { jobId: "bench-job-id", amount: 4500, currency: "USD", method: "card" } },

  // reviews
  { name: "reviews:list", method: "GET", path: "/api/reviews", auth: false },
  { name: "reviews:create", method: "POST", path: "/api/reviews", auth: false,
    body: { jobId: "bench-job-id", rating: 5, comment: "Clear scope and quick replies." } },

  // messages
  { name: "messages:list", method: "GET", path: "/api/messages", auth: false },
  { name: "messages:create", method: "POST", path: "/api/messages", auth: false,
    body: { conversationId: "bench-conversation", body: "Thanks, looking at it now." } },

  // notifications
  { name: "notifications:list", method: "GET", path: "/api/notifications", auth: false },
  { name: "notifications:create", method: "POST", path: "/api/notifications", auth: false,
    body: { userId: "bench-user-id", type: "proposal.received", payload: { jobId: "bench-job-id" } } },

  // search
  { name: "search", method: "GET", path: "/api/search?q=node+postgres", auth: false },

  // admin — the only router behind authMiddleware
  { name: "admin:metrics", method: "GET", path: "/api/admin/metrics", auth: true }
];
