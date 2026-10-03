export const requiredEndpointKeys = [
  "GET /health",
  "POST /api/auth/register",
  "POST /api/auth/login",
  "GET /api/auth/oauth/github/callback",
  "POST /api/auth/refresh",
  "GET /api/users",
  "POST /api/users",
  "GET /api/jobs",
  "POST /api/jobs",
  "GET /api/proposals",
  "POST /api/proposals",
  "POST /api/payments",
  "GET /api/reviews",
  "POST /api/reviews",
  "GET /api/messages",
  "POST /api/messages",
  "GET /api/notifications",
  "POST /api/notifications",
  "POST /api/uploads",
  "GET /api/search?q=contract",
  "GET /api/admin/metrics"
];

export const benchmarkScenarios = [
  {
    name: "health check",
    method: "GET",
    path: "/health",
    tags: ["health"]
  },
  {
    name: "register client",
    method: "POST",
    path: "/api/auth/register",
    body: {
      email: "benchmark-client@example.test",
      password: "benchmark-password",
      role: "client"
    },
    expectedStatus: 201,
    tags: ["auth", "write"]
  },
  {
    name: "login client",
    method: "POST",
    path: "/api/auth/login",
    body: {
      email: "benchmark-client@example.test",
      password: "benchmark-password"
    },
    tags: ["auth", "read"]
  },
  {
    name: "oauth callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback",
    tags: ["auth", "oauth"]
  },
  {
    name: "refresh token",
    method: "POST",
    path: "/api/auth/refresh",
    tags: ["auth", "write"]
  },
  {
    name: "list users",
    method: "GET",
    path: "/api/users",
    tags: ["users", "read"]
  },
  {
    name: "create user",
    method: "POST",
    path: "/api/users",
    body: {
      email: "benchmark-user@example.test",
      name: "Benchmark User",
      role: "freelancer",
      skills: ["node", "api", "benchmark"]
    },
    expectedStatus: 201,
    tags: ["users", "write"]
  },
  {
    name: "list jobs",
    method: "GET",
    path: "/api/jobs",
    tags: ["jobs", "read"]
  },
  {
    name: "create job",
    method: "POST",
    path: "/api/jobs",
    body: {
      title: "Benchmark API integration",
      description: "Measure all API endpoints with representative freelance marketplace payloads.",
      budgetMin: 500,
      budgetMax: 1500,
      categoryId: "cat_development",
      skills: ["node", "express", "testing"]
    },
    expectedStatus: 201,
    tags: ["jobs", "write"]
  },
  {
    name: "list proposals",
    method: "GET",
    path: "/api/proposals",
    tags: ["proposals", "read"]
  },
  {
    name: "create proposal",
    method: "POST",
    path: "/api/proposals",
    body: {
      jobId: "job_benchmark",
      freelancerId: "usr_benchmark_freelancer",
      coverLetter: "I can deliver the benchmark suite with clear reporting and thresholds.",
      bidAmount: 900
    },
    expectedStatus: 201,
    tags: ["proposals", "write"]
  },
  {
    name: "create payment",
    method: "POST",
    path: "/api/payments",
    body: {
      amount: 12500,
      currency: "usd",
      jobId: "job_benchmark",
      freelancerId: "usr_benchmark_freelancer"
    },
    expectedStatus: 201,
    tags: ["payments", "write"]
  },
  {
    name: "list reviews",
    method: "GET",
    path: "/api/reviews",
    tags: ["reviews", "read"]
  },
  {
    name: "create review",
    method: "POST",
    path: "/api/reviews",
    body: {
      jobId: "job_benchmark",
      reviewerId: "usr_benchmark_client",
      revieweeId: "usr_benchmark_freelancer",
      rating: 5,
      comment: "Reliable delivery with clear benchmark evidence."
    },
    expectedStatus: 201,
    tags: ["reviews", "write"]
  },
  {
    name: "list messages",
    method: "GET",
    path: "/api/messages",
    tags: ["messages", "read"]
  },
  {
    name: "create message",
    method: "POST",
    path: "/api/messages",
    body: {
      threadId: "thread_benchmark",
      senderId: "usr_benchmark_client",
      body: "Can you share the latest benchmark summary?"
    },
    expectedStatus: 201,
    tags: ["messages", "write"]
  },
  {
    name: "list notifications",
    method: "GET",
    path: "/api/notifications",
    tags: ["notifications", "read"]
  },
  {
    name: "create notification",
    method: "POST",
    path: "/api/notifications",
    body: {
      userId: "usr_benchmark_client",
      type: "proposal_submitted",
      message: "A freelancer submitted a proposal."
    },
    expectedStatus: 201,
    tags: ["notifications", "write"]
  },
  {
    name: "upload file",
    method: "POST",
    path: "/api/uploads",
    multipart: true,
    fileName: "benchmark.txt",
    fileContents: "benchmark upload payload\n",
    expectedStatus: 201,
    tags: ["uploads", "write"]
  },
  {
    name: "global search",
    method: "GET",
    path: "/api/search?q=contract",
    tags: ["search", "read"]
  },
  {
    name: "admin metrics",
    method: "GET",
    path: "/api/admin/metrics",
    auth: true,
    tags: ["admin", "read"]
  }
];
