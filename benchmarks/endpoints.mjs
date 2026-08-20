export const endpoints = [
  {
    name: "health",
    method: "GET",
    path: "/health",
    description: "Service health check"
  },
  {
    name: "auth-register",
    method: "POST",
    path: "/api/auth/register",
    description: "Register a client account",
    body: () => ({
      email: `benchmark-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
      password: "benchmark-password",
      role: "client"
    })
  },
  {
    name: "auth-login",
    method: "POST",
    path: "/api/auth/login",
    description: "Log in with representative credentials",
    body: {
      email: "benchmark@example.com",
      password: "benchmark-password"
    }
  },
  {
    name: "auth-refresh",
    method: "POST",
    path: "/api/auth/refresh",
    description: "Refresh an access token"
  },
  {
    name: "auth-oauth-callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback",
    description: "OAuth callback route"
  },
  {
    name: "users-list",
    method: "GET",
    path: "/api/users",
    description: "List users"
  },
  {
    name: "users-create",
    method: "POST",
    path: "/api/users",
    description: "Create a user",
    body: () => ({
      email: `user-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
      name: "Benchmark User",
      role: "freelancer",
      skills: ["node", "api", "benchmarking"]
    })
  },
  {
    name: "jobs-list",
    method: "GET",
    path: "/api/jobs",
    description: "List jobs"
  },
  {
    name: "jobs-create",
    method: "POST",
    path: "/api/jobs",
    description: "Create a job with a realistic payload",
    body: {
      title: "Build an API benchmark report",
      description: "Create repeatable endpoint benchmarks with latency and throughput reporting.",
      budgetMin: 500,
      budgetMax: 1500,
      categoryId: "engineering",
      skills: ["node", "express", "performance"]
    }
  },
  {
    name: "proposals-list",
    method: "GET",
    path: "/api/proposals",
    description: "List proposals"
  },
  {
    name: "proposals-create",
    method: "POST",
    path: "/api/proposals",
    description: "Create a proposal",
    body: {
      jobId: "job_benchmark",
      freelancerId: "usr_benchmark",
      coverLetter: "I can deliver a repeatable benchmark suite with JSON and Markdown output.",
      bidAmount: 900
    }
  },
  {
    name: "payments-create",
    method: "POST",
    path: "/api/payments",
    description: "Create a payment intent",
    body: {
      amount: 900,
      currency: "usd",
      jobId: "job_benchmark"
    }
  },
  {
    name: "reviews-list",
    method: "GET",
    path: "/api/reviews",
    description: "List reviews"
  },
  {
    name: "reviews-create",
    method: "POST",
    path: "/api/reviews",
    description: "Create a review",
    body: {
      targetUserId: "usr_benchmark",
      rating: 5,
      comment: "Clear communication and strong technical delivery."
    }
  },
  {
    name: "messages-list",
    method: "GET",
    path: "/api/messages",
    description: "List messages"
  },
  {
    name: "messages-create",
    method: "POST",
    path: "/api/messages",
    description: "Send a message",
    body: {
      conversationId: "cnv_benchmark",
      senderId: "usr_client",
      recipientId: "usr_freelancer",
      body: "Can you share the benchmark summary when it is ready?"
    }
  },
  {
    name: "notifications-list",
    method: "GET",
    path: "/api/notifications",
    description: "List notifications"
  },
  {
    name: "notifications-create",
    method: "POST",
    path: "/api/notifications",
    description: "Create a notification",
    body: {
      userId: "usr_benchmark",
      type: "proposal_received",
      message: "A freelancer sent a proposal."
    }
  },
  {
    name: "uploads-empty",
    method: "POST",
    path: "/api/uploads",
    description: "Exercise upload route without a file"
  },
  {
    name: "search",
    method: "GET",
    path: "/api/search?q=node%20benchmark",
    description: "Search across indexed resources"
  },
  {
    name: "admin-metrics",
    method: "GET",
    path: "/api/admin/metrics",
    description: "Authenticated admin metrics",
    auth: true
  }
];
