import { randomUUID } from "node:crypto";

function email() {
  return `benchmark-${randomUUID()}@example.com`;
}

function multipartUpload() {
  const boundary = `benchmark-${randomUUID()}`;
  const body = Buffer.from(
    [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="benchmark.txt"',
      "Content-Type: text/plain",
      "",
      "benchmark upload payload",
      `--${boundary}--`,
      ""
    ].join("\r\n")
  );

  return {
    body,
    headers: {
      "content-type": `multipart/form-data; boundary=${boundary}`
    }
  };
}

export const endpoints = [
  {
    id: "auth-register",
    method: "POST",
    path: "/api/auth/register",
    expectedStatuses: [201],
    json: () => ({
      email: email(),
      password: "BenchmarkPass123!",
      role: "client"
    })
  },
  {
    id: "auth-login",
    method: "POST",
    path: "/api/auth/login",
    expectedStatuses: [200],
    json: () => ({
      email: "benchmark-login@example.com",
      password: "BenchmarkPass123!"
    })
  },
  {
    id: "auth-oauth-callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback",
    routePattern: "/api/auth/oauth/:provider/callback",
    expectedStatuses: [200]
  },
  {
    id: "auth-refresh",
    method: "POST",
    path: "/api/auth/refresh",
    expectedStatuses: [200]
  },
  {
    id: "users-list",
    method: "GET",
    path: "/api/users",
    expectedStatuses: [200]
  },
  {
    id: "users-create",
    method: "POST",
    path: "/api/users",
    expectedStatuses: [201],
    json: () => ({
      email: email(),
      name: "Benchmark User",
      role: "client"
    })
  },
  {
    id: "jobs-list",
    method: "GET",
    path: "/api/jobs",
    expectedStatuses: [200]
  },
  {
    id: "jobs-create",
    method: "POST",
    path: "/api/jobs",
    expectedStatuses: [201],
    json: () => ({
      title: "Benchmark API Work",
      description: "Synthetic job payload used by the benchmark suite.",
      budgetMin: 250,
      budgetMax: 750,
      categoryId: "cat_api",
      skills: ["node", "api", "benchmarking"]
    })
  },
  {
    id: "proposals-list",
    method: "GET",
    path: "/api/proposals",
    expectedStatuses: [200]
  },
  {
    id: "proposals-create",
    method: "POST",
    path: "/api/proposals",
    expectedStatuses: [201],
    json: () => ({
      jobId: "job_benchmark",
      freelancerId: "usr_benchmark_freelancer",
      coverLetter: "Benchmark proposal payload with realistic length.",
      proposedRate: 95,
      estimatedDurationDays: 7
    })
  },
  {
    id: "payments-create",
    method: "POST",
    path: "/api/payments",
    expectedStatuses: [201],
    json: () => ({
      amount: 75000,
      currency: "usd",
      jobId: "job_benchmark"
    })
  },
  {
    id: "reviews-list",
    method: "GET",
    path: "/api/reviews",
    expectedStatuses: [200]
  },
  {
    id: "reviews-create",
    method: "POST",
    path: "/api/reviews",
    expectedStatuses: [201],
    json: () => ({
      jobId: "job_benchmark",
      reviewerId: "usr_benchmark_client",
      revieweeId: "usr_benchmark_freelancer",
      rating: 5,
      comment: "Reliable benchmark review payload."
    })
  },
  {
    id: "messages-list",
    method: "GET",
    path: "/api/messages",
    expectedStatuses: [200]
  },
  {
    id: "messages-create",
    method: "POST",
    path: "/api/messages",
    expectedStatuses: [201],
    json: () => ({
      conversationId: "conv_benchmark",
      senderId: "usr_benchmark_client",
      recipientId: "usr_benchmark_freelancer",
      body: "Benchmark message payload for API latency measurement."
    })
  },
  {
    id: "notifications-list",
    method: "GET",
    path: "/api/notifications",
    expectedStatuses: [200]
  },
  {
    id: "notifications-create",
    method: "POST",
    path: "/api/notifications",
    expectedStatuses: [201],
    json: () => ({
      userId: "usr_benchmark_client",
      type: "proposal",
      message: "Benchmark notification payload."
    })
  },
  {
    id: "uploads-create",
    method: "POST",
    path: "/api/uploads",
    expectedStatuses: [201],
    raw: multipartUpload
  },
  {
    id: "search",
    method: "GET",
    path: "/api/search?q=api%20benchmark",
    routePattern: "/api/search",
    expectedStatuses: [200]
  },
  {
    id: "admin-metrics",
    method: "GET",
    path: "/api/admin/metrics",
    expectedStatuses: [200],
    protected: true
  }
];

export const coverageEndpoints = endpoints.map((endpoint) => ({
  id: endpoint.id,
  method: endpoint.method,
  routePattern: endpoint.routePattern ?? endpoint.path.split("?")[0]
}));
