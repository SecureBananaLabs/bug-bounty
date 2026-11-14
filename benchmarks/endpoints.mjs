export const benchmarkEndpoints = [
  {
    name: "health",
    method: "GET",
    path: "/health",
  },
  {
    name: "auth register",
    method: "POST",
    path: "/api/auth/register",
    body: (iteration) => ({
      email: `benchmark-${iteration}@example.com`,
      password: "benchmark-pass",
      role: "client",
    }),
  },
  {
    name: "auth login",
    method: "POST",
    path: "/api/auth/login",
    body: () => ({
      email: "benchmark@example.com",
      password: "benchmark-pass",
    }),
  },
  {
    name: "auth oauth callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback",
  },
  {
    name: "auth refresh",
    method: "POST",
    path: "/api/auth/refresh",
  },
  {
    name: "users list",
    method: "GET",
    path: "/api/users",
  },
  {
    name: "users create",
    method: "POST",
    path: "/api/users",
    body: (iteration) => ({
      name: `Benchmark User ${iteration}`,
      email: `user-${iteration}@example.com`,
      role: "freelancer",
    }),
  },
  {
    name: "jobs list",
    method: "GET",
    path: "/api/jobs",
  },
  {
    name: "jobs create",
    method: "POST",
    path: "/api/jobs",
    body: (iteration) => ({
      title: `Benchmark job ${iteration}`,
      description: "A representative benchmark job payload.",
      budgetMin: 500,
      budgetMax: 1500,
      categoryId: "cat_benchmark",
      skills: ["node", "api", "benchmark"],
    }),
  },
  {
    name: "proposals list",
    method: "GET",
    path: "/api/proposals",
  },
  {
    name: "proposals create",
    method: "POST",
    path: "/api/proposals",
    body: (iteration) => ({
      jobId: `job_${iteration}`,
      freelancerId: "usr_benchmark",
      amount: 900,
      coverLetter: "Benchmark proposal payload.",
    }),
  },
  {
    name: "payments create",
    method: "POST",
    path: "/api/payments",
    body: () => ({
      amount: 12500,
      currency: "usd",
      jobId: "job_benchmark",
    }),
  },
  {
    name: "reviews list",
    method: "GET",
    path: "/api/reviews",
  },
  {
    name: "reviews create",
    method: "POST",
    path: "/api/reviews",
    body: () => ({
      reviewerId: "usr_client",
      revieweeId: "usr_freelancer",
      rating: 5,
      comment: "Benchmark review payload.",
    }),
  },
  {
    name: "messages list",
    method: "GET",
    path: "/api/messages",
  },
  {
    name: "messages create",
    method: "POST",
    path: "/api/messages",
    body: () => ({
      threadId: "thread_benchmark",
      senderId: "usr_client",
      body: "Benchmark message payload.",
    }),
  },
  {
    name: "notifications list",
    method: "GET",
    path: "/api/notifications",
  },
  {
    name: "notifications create",
    method: "POST",
    path: "/api/notifications",
    body: () => ({
      userId: "usr_benchmark",
      type: "benchmark",
      message: "Benchmark notification payload.",
    }),
  },
  {
    name: "uploads create",
    method: "POST",
    path: "/api/uploads",
    formData: () => ({
      file: new Blob(["benchmark upload"], { type: "text/plain" }),
      filename: "benchmark.txt",
    }),
  },
  {
    name: "search",
    method: "GET",
    path: "/api/search?q=designer",
  },
  {
    name: "admin metrics",
    method: "GET",
    path: "/api/admin/metrics",
    auth: true,
  },
]
