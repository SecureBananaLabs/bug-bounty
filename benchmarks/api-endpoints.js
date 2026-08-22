const multipartBoundary = "----freelanceflow-benchmark-boundary";

function jsonPayload(value) {
  return {
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(value)
  };
}

function multipartPayload() {
  return {
    headers: {
      "content-type": `multipart/form-data; boundary=${multipartBoundary}`
    },
    body: [
      `--${multipartBoundary}`,
      'Content-Disposition: form-data; name="file"; filename="benchmark-portfolio.txt"',
      "Content-Type: text/plain",
      "",
      "FreelanceFlow benchmark upload payload for realistic file ingestion.",
      `--${multipartBoundary}--`,
      ""
    ].join("\r\n")
  };
}

export const apiEndpoints = [
  {
    name: "register user",
    method: "POST",
    path: "/api/auth/register",
    payload: () =>
      jsonPayload({
        email: `benchmark+${Date.now()}@example.com`,
        password: "BenchmarkPass123!",
        role: "client"
      })
  },
  {
    name: "login user",
    method: "POST",
    path: "/api/auth/login",
    payload: () =>
      jsonPayload({
        email: "benchmark.client@example.com",
        password: "BenchmarkPass123!"
      })
  },
  {
    name: "oauth callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback"
  },
  {
    name: "refresh token",
    method: "POST",
    path: "/api/auth/refresh"
  },
  {
    name: "list users",
    method: "GET",
    path: "/api/users"
  },
  {
    name: "create user",
    method: "POST",
    path: "/api/users",
    payload: () =>
      jsonPayload({
        email: `freelancer+${Date.now()}@example.com`,
        name: "Benchmark Freelancer",
        role: "freelancer",
        skills: ["typescript", "api-performance"],
        hourlyRate: 85
      })
  },
  {
    name: "list jobs",
    method: "GET",
    path: "/api/jobs"
  },
  {
    name: "post job",
    method: "POST",
    path: "/api/jobs",
    payload: () =>
      jsonPayload({
        title: "Build API latency dashboard",
        description: "Create a reproducible benchmark report for core marketplace APIs.",
        budgetMin: 750,
        budgetMax: 2500,
        categoryId: "cat_development",
        skills: ["nodejs", "benchmarking", "observability"]
      })
  },
  {
    name: "list proposals",
    method: "GET",
    path: "/api/proposals"
  },
  {
    name: "create proposal",
    method: "POST",
    path: "/api/proposals",
    payload: () =>
      jsonPayload({
        jobId: "job_benchmark",
        freelancerId: "usr_benchmark_freelancer",
        coverLetter: "I can deliver a performance baseline and regression report.",
        bidAmount: 1200,
        estimatedDays: 5
      })
  },
  {
    name: "create payment",
    method: "POST",
    path: "/api/payments",
    payload: () =>
      jsonPayload({
        jobId: "job_benchmark",
        amount: 1200,
        currency: "usd",
        paymentMethodId: "pm_benchmark"
      })
  },
  {
    name: "list reviews",
    method: "GET",
    path: "/api/reviews"
  },
  {
    name: "create review",
    method: "POST",
    path: "/api/reviews",
    payload: () =>
      jsonPayload({
        jobId: "job_benchmark",
        reviewerId: "usr_benchmark_client",
        revieweeId: "usr_benchmark_freelancer",
        rating: 5,
        comment: "Delivered benchmark coverage and clear reporting."
      })
  },
  {
    name: "list messages",
    method: "GET",
    path: "/api/messages"
  },
  {
    name: "create message",
    method: "POST",
    path: "/api/messages",
    payload: () =>
      jsonPayload({
        conversationId: "conv_benchmark",
        senderId: "usr_benchmark_client",
        recipientId: "usr_benchmark_freelancer",
        body: "Can you share the latest latency report?"
      })
  },
  {
    name: "list notifications",
    method: "GET",
    path: "/api/notifications"
  },
  {
    name: "create notification",
    method: "POST",
    path: "/api/notifications",
    payload: () =>
      jsonPayload({
        userId: "usr_benchmark_client",
        type: "proposal_received",
        message: "A freelancer submitted a proposal for your benchmark project."
      })
  },
  {
    name: "upload file",
    method: "POST",
    path: "/api/uploads",
    payload: multipartPayload
  },
  {
    name: "search",
    method: "GET",
    path: "/api/search?q=api%20benchmark"
  },
  {
    name: "admin metrics",
    method: "GET",
    path: "/api/admin/metrics",
    requiresAuth: true
  }
];
