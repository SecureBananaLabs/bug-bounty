export const benchmarkRoutes = [
  {
    name: "auth.register",
    method: "POST",
    path: "/api/auth/register",
    payload: () => ({
      email: `benchmark-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
      password: "benchmark-password",
      role: "client"
    })
  },
  {
    name: "auth.login",
    method: "POST",
    path: "/api/auth/login",
    payload: () => ({
      email: "benchmark@example.com",
      password: "benchmark-password"
    })
  },
  {
    name: "auth.oauthCallback",
    method: "GET",
    path: "/api/auth/oauth/github/callback"
  },
  {
    name: "auth.refresh",
    method: "POST",
    path: "/api/auth/refresh"
  },
  {
    name: "users.list",
    method: "GET",
    path: "/api/users"
  },
  {
    name: "users.create",
    method: "POST",
    path: "/api/users",
    payload: () => ({
      email: `freelancer-${Date.now()}@example.com`,
      name: "Benchmark Freelancer",
      role: "freelancer",
      skills: ["node", "react", "api-performance"],
      hourlyRate: 75
    })
  },
  {
    name: "jobs.list",
    method: "GET",
    path: "/api/jobs"
  },
  {
    name: "jobs.create",
    method: "POST",
    path: "/api/jobs",
    payload: () => ({
      title: "Benchmark API Suite",
      description: "Create and maintain reproducible API performance benchmarks.",
      budgetMin: 500,
      budgetMax: 1500,
      categoryId: "performance",
      skills: ["node", "express", "benchmarking"]
    })
  },
  {
    name: "proposals.list",
    method: "GET",
    path: "/api/proposals"
  },
  {
    name: "proposals.create",
    method: "POST",
    path: "/api/proposals",
    payload: () => ({
      jobId: "job_benchmark",
      freelancerId: "usr_benchmark",
      coverLetter: "I can deliver a documented API benchmark suite.",
      proposedRate: 900,
      estimatedDays: 3
    })
  },
  {
    name: "payments.create",
    method: "POST",
    path: "/api/payments",
    payload: () => ({
      amount: 750,
      currency: "usd",
      jobId: "job_benchmark",
      clientId: "usr_client",
      freelancerId: "usr_freelancer"
    })
  },
  {
    name: "reviews.list",
    method: "GET",
    path: "/api/reviews"
  },
  {
    name: "reviews.create",
    method: "POST",
    path: "/api/reviews",
    payload: () => ({
      jobId: "job_benchmark",
      reviewerId: "usr_client",
      revieweeId: "usr_freelancer",
      rating: 5,
      comment: "Fast delivery and clear communication."
    })
  },
  {
    name: "messages.list",
    method: "GET",
    path: "/api/messages"
  },
  {
    name: "messages.create",
    method: "POST",
    path: "/api/messages",
    payload: () => ({
      senderId: "usr_client",
      recipientId: "usr_freelancer",
      body: "Can you share the benchmark report?"
    })
  },
  {
    name: "notifications.list",
    method: "GET",
    path: "/api/notifications"
  },
  {
    name: "notifications.create",
    method: "POST",
    path: "/api/notifications",
    payload: () => ({
      userId: "usr_client",
      type: "benchmark.completed",
      message: "API benchmark suite finished successfully."
    })
  },
  {
    name: "uploads.create",
    method: "POST",
    path: "/api/uploads",
    multipart: () => {
      const form = new FormData();
      form.set(
        "file",
        new Blob(["benchmark upload payload"], { type: "text/plain" }),
        "benchmark.txt"
      );
      return form;
    }
  },
  {
    name: "search.query",
    method: "GET",
    path: "/api/search?q=benchmark"
  },
  {
    name: "admin.metrics",
    method: "GET",
    path: "/api/admin/metrics",
    protected: true
  }
];
