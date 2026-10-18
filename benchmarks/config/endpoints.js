/**
 * Endpoint catalogue for the benchmark suite.
 * Every route under /api/ (plus /health) is covered.
 *
 * Fields:
 *  - name: human-readable label
 *  - method: HTTP method
 *  - path: path (query strings included where relevant)
 *  - headers: extra headers (content-type etc.)
 *  - body: static JSON body factory inputs (stringified at run time)
 *  - multipart: { fieldName, filename, contentType, sizeBytes } for uploads
 *  - auth: "admin" to attach the dedicated benchmark bearer token
 *
 * Payloads are realistic and drawn from the production zod schemas
 * (apps/api/src/validators/*) and service contracts.
 */

const realisticJob = {
  title: "Build a React analytics dashboard",
  description:
    "We need an experienced React developer to build an analytics dashboard with charts, filters and CSV export. Roughly 3 weeks of work.",
  budgetMin: 500,
  budgetMax: 2000,
  categoryId: "web-dev",
  skills: ["react", "d3", "typescript"],
};

const realisticProposal = {
  jobId: "job_9f3k2",
  freelancerId: "usr_7h21x",
  coverLetter:
    "I have 5 years of experience building analytics dashboards with React and D3. I can deliver in 3 weeks with weekly demos.",
  bidAmount: 1200,
};

const realisticPayment = {
  amount: 120000,
  currency: "usd",
  jobId: "job_9f3k2",
  freelancerId: "usr_7h21x",
};

const realisticReview = {
  jobId: "job_9f3k2",
  reviewerId: "usr_client1",
  revieweeId: "usr_7h21x",
  rating: 5,
  comment: "Excellent work, delivered on time with great communication.",
};

const realisticMessage = {
  conversationId: "conv_55ab",
  senderId: "usr_7h21x",
  text: "Hi! Quick question about the dashboard filters — should they persist across sessions?",
};

const realisticNotification = {
  userId: "usr_client1",
  type: "proposal_received",
  title: "New proposal received",
  body: "You received a new proposal for 'Build a React analytics dashboard'.",
};

const realisticUser = {
  email: "jane.doe@example.com",
  name: "Jane Doe",
  role: "freelancer",
};

const jsonHeaders = { "content-type": "application/json" };

export const endpoints = [
  { name: "GET /health", method: "GET", path: "/health" },
  {
    name: "POST /api/auth/register",
    method: "POST",
    path: "/api/auth/register",
    headers: jsonHeaders,
    body: {
      email: "bench.user@example.com",
      password: "BenchPass123!",
      role: "client",
    },
  },
  {
    name: "POST /api/auth/login",
    method: "POST",
    path: "/api/auth/login",
    headers: jsonHeaders,
    body: { email: "bench.user@example.com", password: "BenchPass123!" },
  },
  {
    name: "GET /api/auth/oauth/:provider/callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback?code=bench_oauth_code_123",
  },
  {
    name: "POST /api/auth/refresh",
    method: "POST",
    path: "/api/auth/refresh",
    headers: jsonHeaders,
    body: {},
  },
  { name: "GET /api/jobs", method: "GET", path: "/api/jobs/" },
  {
    name: "POST /api/jobs",
    method: "POST",
    path: "/api/jobs/",
    headers: jsonHeaders,
    body: realisticJob,
  },
  { name: "GET /api/proposals", method: "GET", path: "/api/proposals/" },
  {
    name: "POST /api/proposals",
    method: "POST",
    path: "/api/proposals/",
    headers: jsonHeaders,
    body: realisticProposal,
  },
  {
    name: "POST /api/payments",
    method: "POST",
    path: "/api/payments/",
    headers: jsonHeaders,
    body: realisticPayment,
  },
  { name: "GET /api/reviews", method: "GET", path: "/api/reviews/" },
  {
    name: "POST /api/reviews",
    method: "POST",
    path: "/api/reviews/",
    headers: jsonHeaders,
    body: realisticReview,
  },
  { name: "GET /api/messages", method: "GET", path: "/api/messages/" },
  {
    name: "POST /api/messages",
    method: "POST",
    path: "/api/messages/",
    headers: jsonHeaders,
    body: realisticMessage,
  },
  {
    name: "GET /api/notifications",
    method: "GET",
    path: "/api/notifications/",
  },
  {
    name: "POST /api/notifications",
    method: "POST",
    path: "/api/notifications/",
    headers: jsonHeaders,
    body: realisticNotification,
  },
  { name: "GET /api/users", method: "GET", path: "/api/users/" },
  {
    name: "POST /api/users",
    method: "POST",
    path: "/api/users/",
    headers: jsonHeaders,
    body: realisticUser,
  },
  {
    name: "POST /api/uploads",
    method: "POST",
    path: "/api/uploads/",
    multipart: {
      fieldName: "file",
      filename: "benchmark-sample.txt",
      contentType: "text/plain",
      sizeBytes: 1024,
    },
  },
  {
    name: "GET /api/search",
    method: "GET",
    path: "/api/search/?q=react%20dashboard",
  },
  {
    name: "GET /api/admin/metrics",
    method: "GET",
    path: "/api/admin/metrics",
    auth: "admin",
  },
];
