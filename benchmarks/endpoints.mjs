const multipartBoundary = "----freelanceflow-benchmark";
const multipartBody = [
  `--${multipartBoundary}`,
  'Content-Disposition: form-data; name="file"; filename="benchmark.txt"',
  "Content-Type: text/plain",
  "",
  "Benchmark upload payload for API smoke tests.",
  `--${multipartBoundary}--`,
  ""
].join("\r\n");

export const endpoints = [
  {
    name: "auth.register",
    method: "POST",
    path: "/api/auth/register",
    json: {
      email: "benchmark-register@example.com",
      password: "BenchmarkPass123!",
      role: "client"
    }
  },
  {
    name: "auth.login",
    method: "POST",
    path: "/api/auth/login",
    json: { email: "benchmark-login@example.com", password: "BenchmarkPass123!" }
  },
  {
    name: "auth.oauthCallback",
    method: "GET",
    path: "/api/auth/oauth/github/callback"
  },
  {
    name: "auth.refresh",
    method: "POST",
    path: "/api/auth/refresh",
    json: {}
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
    json: {
      email: "benchmark-user@example.com",
      name: "Benchmark User",
      role: "freelancer",
      skills: ["node", "api", "testing"]
    }
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
    json: {
      title: "Benchmark API performance project",
      description:
        "Synthetic benchmark job payload that resembles a small production freelance project.",
      budgetMin: 100000,
      budgetMax: 125000,
      categoryId: "cat_benchmark_engineering",
      skills: ["node", "express", "performance"]
    }
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
    json: {
      jobId: "job_benchmark",
      freelancerId: "usr_benchmark_freelancer",
      coverLetter: "I can benchmark and optimize this API surface.",
      bidAmount: 120000
    }
  },
  {
    name: "payments.create",
    method: "POST",
    path: "/api/payments",
    json: {
      amount: 2500,
      currency: "usd",
      metadata: { benchmark: "true", jobId: "job_benchmark" }
    }
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
    json: {
      jobId: "job_benchmark",
      reviewerId: "usr_benchmark_client",
      subjectId: "usr_benchmark_freelancer",
      rating: 5,
      comment: "Fast, clear, and reliable delivery."
    }
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
    json: {
      fromUserId: "usr_benchmark_client",
      toUserId: "usr_benchmark_freelancer",
      body: "Can you share a benchmark summary by Friday?"
    }
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
    json: {
      userId: "usr_benchmark_client",
      type: "benchmark",
      message: "Your benchmark report is ready."
    }
  },
  {
    name: "uploads.create",
    method: "POST",
    path: "/api/uploads",
    body: multipartBody,
    headers: {
      "content-type": `multipart/form-data; boundary=${multipartBoundary}`
    }
  },
  {
    name: "search.global",
    method: "GET",
    path: "/api/search?q=benchmark%20developer"
  },
  {
    name: "admin.metrics",
    method: "GET",
    path: "/api/admin/metrics",
    auth: true
  }
];
