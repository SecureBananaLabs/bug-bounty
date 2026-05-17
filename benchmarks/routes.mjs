function benchmarkEmail(sequence) {
  return `benchmark+${sequence}@example.com`;
}

function jsonBody(body) {
  return {
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  };
}

function multipartUpload(sequence) {
  const boundary = `----freelanceflow-benchmark-${sequence}`;
  const body = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="file"; filename="benchmark-upload-${sequence}.txt"`,
    "Content-Type: text/plain",
    "",
    "Benchmark upload payload for API throughput measurement.",
    "The file is intentionally small but shaped like a user-provided attachment.",
    `--${boundary}--`,
    ""
  ].join("\r\n");

  return {
    headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
    body
  };
}

export const API_ROUTE_MANIFEST = [
  {
    id: "health",
    method: "GET",
    path: "/health",
    expectedStatus: [200],
    description: "Liveness probe used as a low-cost baseline."
  },
  {
    id: "auth.register",
    method: "POST",
    path: "/api/auth/register",
    expectedStatus: [201],
    description: "Client registration with a production-shaped credential payload.",
    makeRequest: ({ sequence }) =>
      jsonBody({
        email: benchmarkEmail(sequence),
        password: "benchmark-password-123",
        role: "client"
      })
  },
  {
    id: "auth.login",
    method: "POST",
    path: "/api/auth/login",
    expectedStatus: [200],
    description: "Login payload with realistic email and password sizes.",
    makeRequest: ({ sequence }) =>
      jsonBody({
        email: benchmarkEmail(sequence),
        password: "benchmark-password-123"
      })
  },
  {
    id: "auth.oauthCallback",
    method: "GET",
    path: "/api/auth/oauth/github/callback",
    expectedStatus: [200],
    description: "OAuth callback route using GitHub as a representative provider."
  },
  {
    id: "auth.refresh",
    method: "POST",
    path: "/api/auth/refresh",
    expectedStatus: [200],
    description: "Refresh-token endpoint with an empty POST body."
  },
  {
    id: "users.list",
    method: "GET",
    path: "/api/users",
    expectedStatus: [200],
    description: "User index route."
  },
  {
    id: "users.create",
    method: "POST",
    path: "/api/users",
    expectedStatus: [201],
    description: "User creation payload shaped like a client profile.",
    makeRequest: ({ sequence }) =>
      jsonBody({
        email: benchmarkEmail(sequence),
        name: `Benchmark Client ${sequence}`,
        role: "client",
        company: "Acme Marketplace Operations"
      })
  },
  {
    id: "jobs.list",
    method: "GET",
    path: "/api/jobs",
    expectedStatus: [200],
    description: "Job listing route."
  },
  {
    id: "jobs.create",
    method: "POST",
    path: "/api/jobs",
    expectedStatus: [201],
    description: "Job creation payload matching the current Zod schema.",
    makeRequest: ({ sequence }) =>
      jsonBody({
        title: `Benchmark marketplace API tuning ${sequence}`,
        description: "Measure and tune API latency for a freelance marketplace workflow.",
        budgetMin: 1200,
        budgetMax: 3600,
        categoryId: "backend-performance",
        skills: ["nodejs", "express", "benchmarking", "api-design"]
      })
  },
  {
    id: "proposals.list",
    method: "GET",
    path: "/api/proposals",
    expectedStatus: [200],
    description: "Proposal listing route."
  },
  {
    id: "proposals.create",
    method: "POST",
    path: "/api/proposals",
    expectedStatus: [201],
    description: "Proposal payload with bid and short cover letter.",
    makeRequest: ({ sequence }) =>
      jsonBody({
        jobId: `job_benchmark_${sequence}`,
        freelancerId: `usr_benchmark_${sequence}`,
        bidAmount: 2400,
        estimatedDays: 7,
        coverLetter: "I can benchmark the API surface, report latency percentiles, and document regression thresholds."
      })
  },
  {
    id: "payments.create",
    method: "POST",
    path: "/api/payments",
    expectedStatus: [201],
    description: "Payment intent creation payload with currency and amount.",
    makeRequest: ({ sequence }) =>
      jsonBody({
        jobId: `job_benchmark_${sequence}`,
        amount: 2400,
        currency: "usd"
      })
  },
  {
    id: "reviews.list",
    method: "GET",
    path: "/api/reviews",
    expectedStatus: [200],
    description: "Review listing route."
  },
  {
    id: "reviews.create",
    method: "POST",
    path: "/api/reviews",
    expectedStatus: [201],
    description: "Review creation payload with rating and comments.",
    makeRequest: ({ sequence }) =>
      jsonBody({
        jobId: `job_benchmark_${sequence}`,
        reviewerId: `usr_client_${sequence}`,
        revieweeId: `usr_freelancer_${sequence}`,
        rating: 5,
        comment: "Clear communication, predictable delivery, and measurable performance improvements."
      })
  },
  {
    id: "messages.list",
    method: "GET",
    path: "/api/messages",
    expectedStatus: [200],
    description: "Message listing route."
  },
  {
    id: "messages.create",
    method: "POST",
    path: "/api/messages",
    expectedStatus: [201],
    description: "Message payload representative of a client/freelancer conversation.",
    makeRequest: ({ sequence }) =>
      jsonBody({
        conversationId: `conv_benchmark_${sequence}`,
        senderId: `usr_client_${sequence}`,
        recipientId: `usr_freelancer_${sequence}`,
        body: "Please send the benchmark report with latency percentiles and any bottleneck notes."
      })
  },
  {
    id: "notifications.list",
    method: "GET",
    path: "/api/notifications",
    expectedStatus: [200],
    description: "Notification listing route."
  },
  {
    id: "notifications.create",
    method: "POST",
    path: "/api/notifications",
    expectedStatus: [201],
    description: "Notification payload for a marketplace workflow event.",
    makeRequest: ({ sequence }) =>
      jsonBody({
        userId: `usr_benchmark_${sequence}`,
        type: "proposal_submitted",
        title: "New proposal received",
        body: "A freelancer submitted a proposal for your API benchmark project."
      })
  },
  {
    id: "uploads.create",
    method: "POST",
    path: "/api/uploads",
    expectedStatus: [201],
    description: "Multipart upload with a small text attachment.",
    makeRequest: ({ sequence }) => multipartUpload(sequence)
  },
  {
    id: "search.query",
    method: "GET",
    path: "/api/search?q=benchmark%20marketplace",
    expectedStatus: [200],
    description: "Search route with a realistic query string."
  },
  {
    id: "admin.metrics",
    method: "GET",
    path: "/api/admin/metrics",
    expectedStatus: [200],
    auth: true,
    description: "Protected admin metrics endpoint using a benchmark bearer token."
  }
];

export function materializeRequest(route, context = {}) {
  const request = route.makeRequest ? route.makeRequest(context) : {};
  const headers = {
    ...(request.headers ?? {}),
    ...(route.headers ?? {})
  };

  if (route.auth) {
    headers.authorization = `Bearer ${context.authToken}`;
  }

  return {
    method: route.method,
    path: route.path,
    headers,
    body: request.body,
    expectedStatus: route.expectedStatus
  };
}
