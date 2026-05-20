export const benchmarkRoutes = [
  { name: "GET /health", method: "GET", path: "/health", auth: false },
  {
    name: "POST /api/auth/register",
    method: "POST",
    path: "/api/auth/register",
    auth: false,
    json: () => ({
      email: `bench-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
      password: "benchmark-password",
      role: "client"
    })
  },
  {
    name: "POST /api/auth/login",
    method: "POST",
    path: "/api/auth/login",
    auth: false,
    json: () => ({ email: "bench-client@example.com", password: "benchmark-password" })
  },
  {
    name: "GET /api/auth/oauth/:provider/callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback",
    auth: false
  },
  {
    name: "POST /api/auth/refresh",
    method: "POST",
    path: "/api/auth/refresh",
    auth: false,
    json: () => ({ refreshToken: "benchmark-refresh-token" })
  },
  { name: "GET /api/users", method: "GET", path: "/api/users", auth: false },
  {
    name: "POST /api/users",
    method: "POST",
    path: "/api/users",
    auth: false,
    json: () => ({
      name: "Benchmark Client",
      email: `bench-user-${Date.now()}@example.com`,
      role: "client",
      profile: { companySize: "11-50", region: "us" }
    })
  },
  { name: "GET /api/jobs", method: "GET", path: "/api/jobs", auth: false },
  {
    name: "POST /api/jobs",
    method: "POST",
    path: "/api/jobs",
    auth: false,
    json: () => ({
      title: "Build an API benchmark dashboard",
      description: "Create a reusable dashboard that tracks API latency and throughput regressions.",
      budgetMin: 1200,
      budgetMax: 2600,
      categoryId: "cat_backend",
      skills: ["node", "express", "performance"]
    })
  },
  { name: "GET /api/proposals", method: "GET", path: "/api/proposals", auth: false },
  {
    name: "POST /api/proposals",
    method: "POST",
    path: "/api/proposals",
    auth: false,
    json: () => ({
      jobId: "job_benchmark",
      freelancerId: "usr_freelancer_benchmark",
      coverLetter: "I can deliver the benchmark dashboard with regression reporting.",
      bidAmount: 1800,
      timelineDays: 7
    })
  },
  {
    name: "POST /api/payments",
    method: "POST",
    path: "/api/payments",
    auth: false,
    json: () => ({
      amount: 150000,
      currency: "usd",
      jobId: "job_benchmark",
      payerId: "usr_client_benchmark"
    })
  },
  { name: "GET /api/reviews", method: "GET", path: "/api/reviews", auth: false },
  {
    name: "POST /api/reviews",
    method: "POST",
    path: "/api/reviews",
    auth: false,
    json: () => ({
      jobId: "job_benchmark",
      reviewerId: "usr_client_benchmark",
      revieweeId: "usr_freelancer_benchmark",
      rating: 5,
      comment: "Fast delivery and clear benchmark evidence."
    })
  },
  { name: "GET /api/messages", method: "GET", path: "/api/messages", auth: false },
  {
    name: "POST /api/messages",
    method: "POST",
    path: "/api/messages",
    auth: false,
    json: () => ({
      conversationId: "cnv_benchmark",
      senderId: "usr_client_benchmark",
      body: "Can you share the latest benchmark summary?"
    })
  },
  { name: "GET /api/notifications", method: "GET", path: "/api/notifications", auth: false },
  {
    name: "POST /api/notifications",
    method: "POST",
    path: "/api/notifications",
    auth: false,
    json: () => ({
      userId: "usr_client_benchmark",
      type: "benchmark.completed",
      message: "Your API benchmark report is ready."
    })
  },
  {
    name: "POST /api/uploads",
    method: "POST",
    path: "/api/uploads",
    auth: false,
    formData: () => {
      const form = new FormData();
      form.set(
        "file",
        new Blob(["benchmark upload fixture\n"], { type: "text/plain" }),
        "benchmark-fixture.txt"
      );
      return form;
    }
  },
  {
    name: "GET /api/search",
    method: "GET",
    path: "/api/search?q=benchmark%20dashboard",
    auth: false
  },
  { name: "GET /api/admin/metrics", method: "GET", path: "/api/admin/metrics", auth: true }
];
