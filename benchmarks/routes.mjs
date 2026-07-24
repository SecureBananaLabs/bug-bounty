export const benchmarkRoutes = [
  {
    name: "POST /api/auth/register",
    method: "POST",
    path: "/api/auth/register",
    body: {
      email: "benchmark-user@example.com",
      password: "BenchmarkPass123!",
      role: "client"
    }
  },
  {
    name: "POST /api/auth/login",
    method: "POST",
    path: "/api/auth/login",
    body: {
      email: "benchmark-user@example.com",
      password: "BenchmarkPass123!"
    }
  },
  {
    name: "GET /api/auth/oauth/:provider/callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback"
  },
  {
    name: "POST /api/auth/refresh",
    method: "POST",
    path: "/api/auth/refresh",
    body: {}
  },
  {
    name: "GET /api/users",
    method: "GET",
    path: "/api/users"
  },
  {
    name: "POST /api/users",
    method: "POST",
    path: "/api/users",
    body: {
      email: "benchmark-client@example.com",
      role: "client",
      name: "Benchmark Client"
    }
  },
  {
    name: "GET /api/jobs",
    method: "GET",
    path: "/api/jobs"
  },
  {
    name: "POST /api/jobs",
    method: "POST",
    path: "/api/jobs",
    body: {
      title: "Benchmark marketplace landing page",
      description: "Create a responsive landing page for benchmark traffic.",
      budgetMin: 800,
      budgetMax: 1200,
      categoryId: "cat_web_development",
      skills: ["nextjs", "accessibility"]
    }
  },
  {
    name: "GET /api/proposals",
    method: "GET",
    path: "/api/proposals"
  },
  {
    name: "POST /api/proposals",
    method: "POST",
    path: "/api/proposals",
    body: {
      jobId: "job_benchmark",
      freelancerId: "usr_benchmark_freelancer",
      amount: 950,
      coverLetter: "I can deliver the requested benchmark scenario."
    }
  },
  {
    name: "POST /api/payments",
    method: "POST",
    path: "/api/payments",
    body: {
      amount: 950,
      currency: "usd",
      jobId: "job_benchmark"
    }
  },
  {
    name: "GET /api/reviews",
    method: "GET",
    path: "/api/reviews"
  },
  {
    name: "POST /api/reviews",
    method: "POST",
    path: "/api/reviews",
    body: {
      jobId: "job_benchmark",
      rating: 5,
      comment: "Benchmark review payload"
    }
  },
  {
    name: "GET /api/messages",
    method: "GET",
    path: "/api/messages"
  },
  {
    name: "POST /api/messages",
    method: "POST",
    path: "/api/messages",
    body: {
      conversationId: "conv_benchmark",
      body: "Benchmark message payload"
    }
  },
  {
    name: "GET /api/notifications",
    method: "GET",
    path: "/api/notifications"
  },
  {
    name: "POST /api/notifications",
    method: "POST",
    path: "/api/notifications",
    body: {
      userId: "usr_benchmark",
      type: "job_update",
      message: "Benchmark notification payload"
    }
  },
  {
    name: "POST /api/uploads",
    method: "POST",
    path: "/api/uploads",
    body: {}
  },
  {
    name: "GET /api/search",
    method: "GET",
    path: "/api/search?q=benchmark"
  },
  {
    name: "GET /api/admin/metrics",
    method: "GET",
    path: "/api/admin/metrics",
    auth: true
  }
];
