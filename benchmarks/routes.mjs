export const benchmarkRoutes = [
  {
    name: "auth-register",
    method: "POST",
    path: "/api/auth/register",
    json: () => ({
      email: `bench-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      password: "benchmark-password",
      role: "client"
    })
  },
  {
    name: "auth-login",
    method: "POST",
    path: "/api/auth/login",
    json: {
      email: "benchmark-user@example.com",
      password: "benchmark-password"
    }
  },
  {
    name: "auth-oauth-callback",
    method: "GET",
    path: "/api/auth/oauth/google/callback"
  },
  {
    name: "auth-refresh",
    method: "POST",
    path: "/api/auth/refresh",
    json: {}
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
    json: () => ({
      name: "Benchmark User",
      email: `bench-user-${Date.now()}@example.com`,
      role: "client",
      profile: {
        headline: "Benchmark profile",
        skills: ["node", "api", "performance"]
      }
    })
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
    json: () => ({
      title: "Benchmark API performance report",
      description:
        "Create a reproducible benchmark report with realistic payload size.",
      budgetMin: 500,
      budgetMax: 1500,
      categoryId: "cat_performance",
      skills: ["node", "express", "benchmarking"]
    })
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
    json: () => ({
      jobId: "job_benchmark",
      freelancerId: "usr_benchmark",
      coverLetter:
        "I can deliver a repeatable API benchmark suite with latency and error-rate reporting.",
      rate: 75,
      estimatedDays: 3
    })
  },
  {
    name: "payments-create",
    method: "POST",
    path: "/api/payments",
    json: {
      amount: 5000,
      currency: "usd",
      metadata: {
        benchmark: "api-suite",
        route: "payments-create"
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
    json: {
      targetId: "usr_benchmark",
      rating: 5,
      comment:
        "Clear communication, reliable delivery, and measurable performance improvements."
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
    json: {
      conversationId: "conv_benchmark",
      senderId: "usr_benchmark",
      recipientId: "usr_client",
      body: "Benchmark message payload for API throughput testing."
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
    json: {
      userId: "usr_benchmark",
      type: "benchmark",
      message: "Benchmark notification payload"
    }
  },
  {
    name: "uploads-create",
    method: "POST",
    path: "/api/uploads",
    formData: () => {
      const form = new FormData();
      form.set(
        "file",
        new Blob(["benchmark upload payload\n"], { type: "text/plain" }),
        "benchmark.txt"
      );
      return form;
    }
  },
  {
    name: "search",
    method: "GET",
    path: "/api/search?q=benchmark%20api%20latency"
  },
  {
    name: "admin-metrics",
    method: "GET",
    path: "/api/admin/metrics",
    auth: true
  }
];
