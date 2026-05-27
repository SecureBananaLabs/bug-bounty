export const endpoints = [
  {
    name: "health",
    method: "GET",
    path: "/health"
  },
  {
    name: "auth-register",
    method: "POST",
    path: "/api/auth/register",
    body: ({ sequence }) => ({
      email: `benchmark-${Date.now()}-${sequence}@example.com`,
      password: "benchmark-password",
      role: "client"
    })
  },
  {
    name: "auth-login",
    method: "POST",
    path: "/api/auth/login",
    body: () => ({
      email: "benchmark@example.com",
      password: "benchmark-password"
    })
  },
  {
    name: "auth-oauth-callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback"
  },
  {
    name: "auth-refresh",
    method: "POST",
    path: "/api/auth/refresh"
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
    body: ({ sequence }) => ({
      email: `user-${Date.now()}-${sequence}@example.com`,
      name: `Benchmark User ${sequence}`,
      role: "client"
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
    body: ({ sequence }) => ({
      title: `Benchmark job ${sequence}`,
      description: "Synthetic benchmark job payload for API latency tracking.",
      budgetMin: 100,
      budgetMax: 500,
      categoryId: "benchmark-category",
      skills: ["api", "benchmark"]
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
    body: ({ sequence }) => ({
      jobId: "benchmark-job",
      freelancerId: `benchmark-freelancer-${sequence}`,
      coverLetter: "Synthetic benchmark proposal payload.",
      bidAmount: 250
    })
  },
  {
    name: "payments-create",
    method: "POST",
    path: "/api/payments",
    body: () => ({
      amount: 2500,
      currency: "usd",
      proposalId: "benchmark-proposal"
    })
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
    body: () => ({
      targetId: "benchmark-target",
      rating: 5,
      comment: "Synthetic benchmark review payload."
    })
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
    body: ({ sequence }) => ({
      threadId: "benchmark-thread",
      senderId: "benchmark-sender",
      body: `Synthetic benchmark message ${sequence}.`
    })
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
    body: ({ sequence }) => ({
      userId: "benchmark-user",
      type: "benchmark",
      message: `Synthetic benchmark notification ${sequence}.`
    })
  },
  {
    name: "uploads-create",
    method: "POST",
    path: "/api/uploads",
    formData: () => {
      const form = new FormData();
      form.set("file", new Blob(["benchmark upload payload"], { type: "text/plain" }), "benchmark.txt");
      return form;
    }
  },
  {
    name: "search",
    method: "GET",
    path: "/api/search?q=benchmark"
  },
  {
    name: "admin-metrics",
    method: "GET",
    path: "/api/admin/metrics",
    auth: true
  }
];
