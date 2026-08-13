/**
 * The endpoints covered by the benchmark suite, with the payloads they are
 * exercised with.
 *
 * Every route group mounted in `apps/api/src/app.js` appears here. Payload
 * shapes follow the Prisma schema in `packages/db/prisma/schema.prisma` so the
 * numbers reflect realistic request sizes rather than empty bodies.
 *
 * `auth` marks the routes that go through `middleware/auth.js`; the runner
 * signs a dedicated benchmark token for those.
 */

/** A body big enough to be representative without being pathological. */
const jobDescription =
  "We need a senior engineer to migrate our billing service off the legacy " +
  "queue. The work is well scoped, the test suite is green, and the team is " +
  "available for questions during European working hours.";

export const endpoints = [
  { name: "health", method: "GET", path: "/health", auth: false },

  { name: "auth:register", method: "POST", path: "/api/auth/register", auth: false,
    body: { email: "bench@example.com", password: "benchmark-password", name: "Bench User" } },
  { name: "auth:login", method: "POST", path: "/api/auth/login", auth: false,
    body: { email: "bench@example.com", password: "benchmark-password" } },
  { name: "auth:refresh", method: "POST", path: "/api/auth/refresh", auth: false,
    body: { refreshToken: "benchmark-refresh-token" } },

  { name: "users:list", method: "GET", path: "/api/users", auth: true },
  { name: "jobs:list", method: "GET", path: "/api/jobs", auth: false },
  { name: "jobs:create", method: "POST", path: "/api/jobs", auth: true,
    body: { title: "Migrate billing service", description: jobDescription,
            budget: 4800, currency: "USD", tags: ["node", "postgres", "queues"] } },

  { name: "proposals:list", method: "GET", path: "/api/proposals", auth: true },
  { name: "proposals:create", method: "POST", path: "/api/proposals", auth: true,
    body: { jobId: "bench-job-id", coverLetter: jobDescription, bid: 4500 } },

  { name: "payments:list", method: "GET", path: "/api/payments", auth: true },
  { name: "reviews:list", method: "GET", path: "/api/reviews", auth: true },
  { name: "messages:list", method: "GET", path: "/api/messages", auth: true },
  { name: "notifications:list", method: "GET", path: "/api/notifications", auth: true },
  { name: "uploads:list", method: "GET", path: "/api/uploads", auth: true },
  { name: "search", method: "GET", path: "/api/search?q=node+postgres", auth: false },
  { name: "admin:list", method: "GET", path: "/api/admin", auth: true }
];
