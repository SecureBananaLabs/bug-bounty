export const benchmarkRoutes = [
  {
    name: "auth-register",
    method: "POST",
    path: "/api/auth/register",
    body: {
      email: "benchmark-client@example.com",
      password: "benchmark-password",
      role: "client"
    }
  },
  {
    name: "auth-login",
    method: "POST",
    path: "/api/auth/login",
    body: {
      email: "benchmark-client@example.com",
      password: "benchmark-password"
    }
  },
  {
    name: "auth-refresh",
    method: "POST",
    path: "/api/auth/refresh"
  },
  {
    name: "auth-oauth-callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback"
  },
  {
    name: "users-list",
    method: "GET",
    path: "/api/users"
  },
  {
    name: "users-create",
    method: "POST",
    path: "/api/users",
    body: {
      email: "benchmark-freelancer@example.com",
      role: "freelancer",
      displayName: "Benchmark Freelancer",
      status: "active"
    }
  },
  {
    name: "jobs-list",
    method: "GET",
    path: "/api/jobs"
  },
  {
    name: "jobs-create",
    method: "POST",
    path: "/api/jobs",
    body: {
      title: "Benchmark marketplace build",
      description: "Create a production-ready benchmark fixture payload for API load testing.",
      budgetMin: 500,
      budgetMax: 1200,
      categoryId: "cat_engineering",
      skills: ["node", "express", "performance"]
    }
  },
  {
    name: "proposals-list",
    method: "GET",
    path: "/api/proposals"
  },
  {
    name: "proposals-create",
    method: "POST",
    path: "/api/proposals",
    body: {
      jobId: "job_benchmark",
      freelancerId: "usr_benchmark_freelancer",
      coverLetter: "I can deliver this benchmark fixture with clear validation evidence.",
      bidAmount: 900
    }
  },
  {
    name: "payments-create",
    method: "POST",
    path: "/api/payments",
    body: {
      amount: 2500,
      currency: "usd",
      metadata: {
        source: "api-benchmark",
        jobId: "job_benchmark"
      }
    }
  },
  {
    name: "reviews-list",
    method: "GET",
    path: "/api/reviews"
  },
  {
    name: "reviews-create",
    method: "POST",
    path: "/api/reviews",
    body: {
      targetUserId: "usr_benchmark_freelancer",
      rating: 5,
      comment: "Fast delivery and clear communication."
    }
  },
  {
    name: "messages-list",
    method: "GET",
    path: "/api/messages"
  },
  {
    name: "messages-create",
    method: "POST",
    path: "/api/messages",
    body: {
      conversationId: "conv_benchmark",
      senderId: "usr_benchmark_client",
      body: "Can you share the latest milestone status?"
    }
  },
  {
    name: "notifications-list",
    method: "GET",
    path: "/api/notifications"
  },
  {
    name: "notifications-create",
    method: "POST",
    path: "/api/notifications",
    body: {
      userId: "usr_benchmark_client",
      type: "proposal_received",
      message: "A freelancer submitted a proposal."
    }
  },
  {
    name: "uploads-create",
    method: "POST",
    path: "/api/uploads",
    headers: {
      "content-type": "application/json"
    },
    body: {}
  },
  {
    name: "search-global",
    method: "GET",
    path: "/api/search?q=performance"
  },
  {
    name: "admin-metrics",
    method: "GET",
    path: "/api/admin/metrics",
    auth: true
  }
];
