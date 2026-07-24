export const benchmarkEndpoints = [
  {
    name: "health",
    method: "GET",
    path: "/health",
    expectedStatus: 200
  },
  {
    name: "auth-register",
    method: "POST",
    path: "/api/auth/register",
    expectedStatus: 201,
    json: ({ iteration }) => ({
      email: `benchmark-user-${Date.now()}-${iteration}@example.com`,
      password: "benchmark-pass-123",
      role: "freelancer"
    })
  },
  {
    name: "auth-login",
    method: "POST",
    path: "/api/auth/login",
    expectedStatus: 200,
    json: {
      email: "benchmark-user@example.com",
      password: "benchmark-pass-123"
    }
  },
  {
    name: "auth-oauth-callback",
    method: "GET",
    path: "/api/auth/oauth/benchmark/callback",
    expectedStatus: 200
  },
  {
    name: "auth-refresh",
    method: "POST",
    path: "/api/auth/refresh",
    expectedStatus: 200
  },
  {
    name: "users-list",
    method: "GET",
    path: "/api/users",
    expectedStatus: 200
  },
  {
    name: "users-create",
    method: "POST",
    path: "/api/users",
    expectedStatus: 201,
    json: ({ iteration }) => ({
      email: `benchmark-client-${iteration}@example.com`,
      name: "Benchmark Client",
      role: "client"
    })
  },
  {
    name: "jobs-list",
    method: "GET",
    path: "/api/jobs",
    expectedStatus: 200
  },
  {
    name: "jobs-create",
    method: "POST",
    path: "/api/jobs",
    expectedStatus: 201,
    json: {
      title: "Benchmark API implementation",
      description: "Create a benchmark suite with realistic local payloads.",
      budgetMin: 500,
      budgetMax: 1500,
      categoryId: "software-development",
      skills: ["node", "express", "benchmarking"]
    }
  },
  {
    name: "proposals-list",
    method: "GET",
    path: "/api/proposals",
    expectedStatus: 200
  },
  {
    name: "proposals-create",
    method: "POST",
    path: "/api/proposals",
    expectedStatus: 201,
    json: {
      jobId: "job_benchmark",
      freelancerId: "usr_benchmark",
      coverLetter: "I can deliver a reproducible API benchmark suite.",
      price: 950,
      timelineDays: 5
    }
  },
  {
    name: "payments-create",
    method: "POST",
    path: "/api/payments",
    expectedStatus: 201,
    json: {
      amount: 95000,
      currency: "usd",
      jobId: "job_benchmark"
    }
  },
  {
    name: "reviews-list",
    method: "GET",
    path: "/api/reviews",
    expectedStatus: 200
  },
  {
    name: "reviews-create",
    method: "POST",
    path: "/api/reviews",
    expectedStatus: 201,
    json: {
      jobId: "job_benchmark",
      reviewerId: "usr_client",
      revieweeId: "usr_freelancer",
      rating: 5,
      comment: "Fast delivery and clear reporting."
    }
  },
  {
    name: "messages-list",
    method: "GET",
    path: "/api/messages",
    expectedStatus: 200
  },
  {
    name: "messages-create",
    method: "POST",
    path: "/api/messages",
    expectedStatus: 201,
    json: {
      fromUserId: "usr_client",
      toUserId: "usr_freelancer",
      body: "Can you share the latest benchmark report?"
    }
  },
  {
    name: "notifications-list",
    method: "GET",
    path: "/api/notifications",
    expectedStatus: 200
  },
  {
    name: "notifications-create",
    method: "POST",
    path: "/api/notifications",
    expectedStatus: 201,
    json: {
      userId: "usr_client",
      type: "proposal_received",
      message: "A freelancer submitted a proposal."
    }
  },
  {
    name: "uploads-create",
    method: "POST",
    path: "/api/uploads",
    expectedStatus: 201,
    multipart: {
      fieldName: "file",
      filename: "benchmark-profile.txt",
      type: "text/plain",
      body: "Synthetic benchmark upload payload for API route coverage."
    }
  },
  {
    name: "search",
    method: "GET",
    path: "/api/search?q=benchmark",
    expectedStatus: 200
  },
  {
    name: "admin-metrics",
    method: "GET",
    path: "/api/admin/metrics",
    expectedStatus: 200,
    auth: true
  }
];
