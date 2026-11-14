export const benchmarkEndpoints = [
  {
    id: "health",
    method: "GET",
    path: "/health",
    description: "Health probe used by load balancers and uptime checks"
  },
  {
    id: "auth-register",
    method: "POST",
    path: "/api/auth/register",
    description: "Client registration with a realistic freelancer profile payload",
    body: {
      email: "bench.freelancer@example.com",
      password: "BenchmarkPassw0rd!",
      role: "freelancer"
    }
  },
  {
    id: "auth-login",
    method: "POST",
    path: "/api/auth/login",
    description: "Login route returning a short-lived access token",
    body: {
      email: "bench.freelancer@example.com",
      password: "BenchmarkPassw0rd!"
    }
  },
  {
    id: "auth-refresh",
    method: "POST",
    path: "/api/auth/refresh",
    description: "Access-token refresh path"
  },
  {
    id: "auth-oauth-callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback?code=benchmark-code&state=benchmark-state",
    description: "OAuth callback acknowledgement"
  },
  {
    id: "users-list",
    method: "GET",
    path: "/api/users",
    description: "List platform users"
  },
  {
    id: "users-create",
    method: "POST",
    path: "/api/users",
    description: "Create a user profile with searchable skills",
    body: {
      email: "benchmark-user@example.com",
      name: "Benchmark User",
      role: "freelancer",
      skills: ["node", "api", "benchmarking"],
      hourlyRate: 85
    }
  },
  {
    id: "jobs-list",
    method: "GET",
    path: "/api/jobs",
    description: "List open jobs"
  },
  {
    id: "jobs-create",
    method: "POST",
    path: "/api/jobs",
    description: "Create a representative fixed-price job",
    body: {
      title: "Benchmark API integration",
      description: "Integrate a payment provider and return a reproducible test report.",
      budgetMin: 750,
      budgetMax: 1250,
      categoryId: "api-integrations",
      skills: ["node", "express", "payments"],
      deadline: "2026-06-30"
    }
  },
  {
    id: "proposals-list",
    method: "GET",
    path: "/api/proposals",
    description: "List job proposals"
  },
  {
    id: "proposals-create",
    method: "POST",
    path: "/api/proposals",
    description: "Submit a proposal with milestone pricing",
    body: {
      jobId: "job_benchmark",
      freelancerId: "usr_benchmark",
      coverLetter: "I can deliver this API benchmark suite with documented thresholds.",
      amount: 950,
      estimatedDays: 5
    }
  },
  {
    id: "payments-create",
    method: "POST",
    path: "/api/payments",
    description: "Create an escrow payment intent",
    body: {
      amount: 95000,
      currency: "usd",
      metadata: {
        jobId: "job_benchmark",
        proposalId: "prp_benchmark"
      }
    }
  },
  {
    id: "reviews-list",
    method: "GET",
    path: "/api/reviews",
    description: "List freelancer reviews"
  },
  {
    id: "reviews-create",
    method: "POST",
    path: "/api/reviews",
    description: "Create a post-contract review",
    body: {
      freelancerId: "usr_benchmark",
      jobId: "job_benchmark",
      rating: 5,
      comment: "Delivered clear benchmark evidence and follow-up notes."
    }
  },
  {
    id: "messages-list",
    method: "GET",
    path: "/api/messages",
    description: "List project messages"
  },
  {
    id: "messages-create",
    method: "POST",
    path: "/api/messages",
    description: "Send a project-scoped message",
    body: {
      threadId: "thread_benchmark",
      senderId: "usr_benchmark",
      recipientId: "usr_client",
      body: "Benchmark run finished and the Markdown summary is attached."
    }
  },
  {
    id: "notifications-list",
    method: "GET",
    path: "/api/notifications",
    description: "List notification feed entries"
  },
  {
    id: "notifications-create",
    method: "POST",
    path: "/api/notifications",
    description: "Create a project notification",
    body: {
      userId: "usr_client",
      type: "benchmark.ready",
      message: "The benchmark report is ready for review."
    }
  },
  {
    id: "uploads-create",
    method: "POST",
    path: "/api/uploads",
    description: "Upload a small evidence file using multipart form data",
    multipart: {
      fieldName: "file",
      filename: "benchmark-report.txt",
      contentType: "text/plain",
      content: "benchmark evidence fixture"
    }
  },
  {
    id: "search",
    method: "GET",
    path: "/api/search?q=benchmark%20node",
    description: "Global search query with a multi-word term"
  },
  {
    id: "admin-metrics",
    method: "GET",
    path: "/api/admin/metrics",
    description: "Authenticated admin metrics endpoint",
    auth: true
  }
];

export const benchmarkEndpointIds = benchmarkEndpoints.map((endpoint) => endpoint.id);
