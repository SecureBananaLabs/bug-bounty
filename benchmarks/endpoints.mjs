const multipartBoundary = "----freelanceflow-benchmark";
const multipartBody = [
  `--${multipartBoundary}`,
  'Content-Disposition: form-data; name="file"; filename="benchmark-brief.txt"',
  "Content-Type: text/plain",
  "",
  "Synthetic benchmark upload payload for API latency testing.",
  `--${multipartBoundary}--`,
  ""
].join("\r\n");

export const endpoints = [
  {
    name: "Register user",
    method: "POST",
    path: "/api/auth/register",
    expectedStatuses: [201],
    json: {
      email: "benchmark.register@example.com",
      password: "benchmark-password",
      role: "client"
    }
  },
  {
    name: "Login user",
    method: "POST",
    path: "/api/auth/login",
    expectedStatuses: [200],
    json: {
      email: "benchmark.client@example.com",
      password: "benchmark-password"
    }
  },
  {
    name: "OAuth callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback",
    expectedStatuses: [200]
  },
  {
    name: "Refresh token",
    method: "POST",
    path: "/api/auth/refresh",
    expectedStatuses: [200]
  },
  {
    name: "List users",
    method: "GET",
    path: "/api/users",
    expectedStatuses: [200]
  },
  {
    name: "Create user",
    method: "POST",
    path: "/api/users",
    expectedStatuses: [201],
    json: {
      email: "benchmark.freelancer@example.com",
      displayName: "Benchmark Freelancer",
      role: "freelancer",
      status: "active",
      skills: ["node", "api", "benchmarking"]
    }
  },
  {
    name: "List jobs",
    method: "GET",
    path: "/api/jobs",
    expectedStatuses: [200]
  },
  {
    name: "Create job",
    method: "POST",
    path: "/api/jobs",
    expectedStatuses: [201],
    json: {
      title: "Benchmark marketplace API project",
      description: "Synthetic job payload shaped like a realistic freelance marketplace listing.",
      budgetMin: 500,
      budgetMax: 1500,
      categoryId: "cat_development",
      skills: ["typescript", "express", "performance"]
    }
  },
  {
    name: "List proposals",
    method: "GET",
    path: "/api/proposals",
    expectedStatuses: [200]
  },
  {
    name: "Create proposal",
    method: "POST",
    path: "/api/proposals",
    expectedStatuses: [201],
    json: {
      jobId: "job_benchmark",
      freelancerId: "usr_benchmark_freelancer",
      coverLetter: "I can deliver the benchmark project with a measurable performance baseline.",
      bidAmount: 950,
      estimatedDays: 7
    }
  },
  {
    name: "Create payment",
    method: "POST",
    path: "/api/payments",
    expectedStatuses: [201],
    json: {
      amount: 75000,
      currency: "usd",
      jobId: "job_benchmark",
      payerId: "usr_benchmark_client"
    }
  },
  {
    name: "List reviews",
    method: "GET",
    path: "/api/reviews",
    expectedStatuses: [200]
  },
  {
    name: "Create review",
    method: "POST",
    path: "/api/reviews",
    expectedStatuses: [201],
    json: {
      jobId: "job_benchmark",
      reviewerId: "usr_benchmark_client",
      revieweeId: "usr_benchmark_freelancer",
      rating: 5,
      comment: "Delivered measurable performance improvements and clear documentation."
    }
  },
  {
    name: "List messages",
    method: "GET",
    path: "/api/messages",
    expectedStatuses: [200]
  },
  {
    name: "Send message",
    method: "POST",
    path: "/api/messages",
    expectedStatuses: [201],
    json: {
      conversationId: "conv_benchmark",
      senderId: "usr_benchmark_client",
      recipientId: "usr_benchmark_freelancer",
      body: "Can you share the latest benchmark summary before our review?"
    }
  },
  {
    name: "List notifications",
    method: "GET",
    path: "/api/notifications",
    expectedStatuses: [200]
  },
  {
    name: "Create notification",
    method: "POST",
    path: "/api/notifications",
    expectedStatuses: [201],
    json: {
      userId: "usr_benchmark_client",
      type: "benchmark_report_ready",
      message: "Your API benchmark report is ready for review."
    }
  },
  {
    name: "Upload file",
    method: "POST",
    path: "/api/uploads",
    expectedStatuses: [201],
    headers: {
      "content-type": `multipart/form-data; boundary=${multipartBoundary}`
    },
    body: multipartBody
  },
  {
    name: "Global search",
    method: "GET",
    path: "/api/search?q=typescript%20benchmark",
    expectedStatuses: [200]
  },
  {
    name: "Admin metrics",
    method: "GET",
    path: "/api/admin/metrics",
    expectedStatuses: [200],
    auth: true
  }
];
