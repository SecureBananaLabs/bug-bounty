// Route manifest: every mounted endpoint plus /health.
//
// Derived from the real routers (apps/api/src/routes/*.js) and their mount paths
// (apps/api/src/app.js), NOT from a guess. Payload shapes are matched to
// apps/api/src/validators/*.js where a schema exists (createJobSchema requires
// budgetMin/budgetMax/categoryId — not budget/category) and to the service
// signatures elsewhere.
//
// Only /api/admin/metrics is auth-gated (routes/adminRoutes.js uses authMiddleware);
// its token is minted with the app's own secret, like the app signs it.

const json = (o) => ({ "content-type": "application/json", body: JSON.stringify(o) });

export const ENDPOINTS = [
  // --- unauthenticated liveness ---
  { name: "health", method: "GET", path: "/health", auth: false },

  // --- auth ---
  { name: "auth.register", method: "POST", path: "/api/auth/register", auth: false,
    expect: [201],
    headers: json({ email: "bench.user@example.com", password: "benchmark-pass-123", role: "client" }) },
  { name: "auth.login", method: "POST", path: "/api/auth/login", auth: false,
    expect: [200],
    headers: json({ email: "bench.user@example.com", password: "benchmark-pass-123" }) },
  { name: "auth.refresh", method: "POST", path: "/api/auth/refresh", auth: false,
    expect: [200], headers: json({}) },
  { name: "auth.oauthCallBack", method: "GET", path: "/api/auth/oauth/github/callback", auth: false,
    query: { code: "bench-code", state: "bench-state" } },

  // --- jobs (createJobSchema is the only strict validator in the app) ---
  { name: "jobs.list", method: "GET", path: "/api/jobs", auth: false },
  { name: "jobs.create", method: "POST", path: "/api/jobs", auth: false, expect: [201],
    headers: json({
      title: "Benchmark job payload",
      description: "A realistic job description used by the benchmark suite for load testing.",
      budgetMin: 500, budgetMax: 5000,
      categoryId: "cat_development",
      skills: ["node", "express", "benchmarking"]
    }) },

  // --- users / proposals / reviews / messages / notifications / payments ---
  { name: "users.list", method: "GET", path: "/api/users", auth: false },
  { name: "users.create", method: "POST", path: "/api/users", auth: false, expect: [201],
    headers: json({ email: "bench.created@example.com", name: "Bench User", role: "freelancer" }) },

  { name: "proposals.list", method: "GET", path: "/api/proposals", auth: false },
  { name: "proposals.create", method: "POST", path: "/api/proposals", auth: false, expect: [201],
    headers: json({ jobId: "job_bench", freelancerId: "usr_bench", amount: 1200, coverLetter: "Benchmark proposal body." }) },

  { name: "reviews.list", method: "GET", path: "/api/reviews", auth: false },
  { name: "reviews.create", method: "POST", path: "/api/reviews", auth: false, expect: [201],
    headers: json({ jobId: "job_bench", reviewerId: "usr_bench", rating: 5, comment: "Benchmark review body." }) },

  { name: "messages.list", method: "GET", path: "/api/messages", auth: false },
  { name: "messages.create", method: "POST", path: "/api/messages", auth: false, expect: [201],
    headers: json({ threadId: "thr_bench", from: "usr_bench", body: "Benchmark message body." }) },

  { name: "notifications.list", method: "GET", path: "/api/notifications", auth: false },
  { name: "notifications.create", method: "POST", path: "/api/notifications", auth: false, expect: [201],
    headers: json({ userId: "usr_bench", type: "job_update", message: "Benchmark notification." }) },

  { name: "payments.create", method: "POST", path: "/api/payments", auth: false, expect: [201],
    headers: json({ amount: 2500, currency: "usd", jobId: "job_bench" }) },

  // --- uploads (multipart; multer memoryStorage, field name "file") ---
  { name: "uploads.create", method: "POST", path: "/api/uploads", auth: false, multipart: true },

  // --- search ---
  { name: "search.query", method: "GET", path: "/api/search", auth: false, query: { q: "benchmark" } },

  // --- the ONLY auth-gated route ---
  { name: "admin.metrics", method: "GET", path: "/api/admin/metrics", auth: true }
];

// authtoken is minted by run-benchmark.js with env.jwtSecret so this route
// actually exercises its controller instead of short-circuiting on 401.
export const AUTH_CLAIMS = { sub: "usr_bench", role: "admin" };
