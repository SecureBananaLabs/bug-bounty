function jsonPayload(payload) {
  return {
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  };
}

function uploadPayload(iteration) {
  const boundary = `----freelanceflow-benchmark-${iteration}`;
  const body = Buffer.from([
    `--${boundary}`,
    'content-disposition: form-data; name="file"; filename="portfolio-sample.txt"',
    "content-type: text/plain",
    "",
    "Synthetic benchmark upload for a portfolio attachment.",
    `--${boundary}--`,
    ""
  ].join("\r\n"));

  return {
    headers: {
      "content-type": `multipart/form-data; boundary=${boundary}`,
      "content-length": String(body.length)
    },
    body
  };
}

export const BENCHMARK_ENDPOINTS = [
  {
    name: "health",
    method: "GET",
    path: "/health",
    description: "Platform health check"
  },
  {
    name: "auth-register",
    method: "POST",
    path: "/api/auth/register",
    description: "Client account registration",
    payload: (iteration) => jsonPayload({
      email: `benchmark.client.${iteration}@example.com`,
      password: "benchmark-password-123",
      role: "client"
    })
  },
  {
    name: "auth-login",
    method: "POST",
    path: "/api/auth/login",
    description: "Existing client login",
    payload: (iteration) => jsonPayload({
      email: `benchmark.client.${iteration}@example.com`,
      password: "benchmark-password-123"
    })
  },
  {
    name: "auth-oauth-callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback",
    description: "OAuth provider callback acknowledgement"
  },
  {
    name: "auth-refresh",
    method: "POST",
    path: "/api/auth/refresh",
    description: "Access token refresh"
  },
  {
    name: "users-list",
    method: "GET",
    path: "/api/users",
    description: "User directory listing"
  },
  {
    name: "users-create",
    method: "POST",
    path: "/api/users",
    description: "User profile creation",
    payload: (iteration) => jsonPayload({
      email: `freelancer.${iteration}@example.com`,
      name: "Benchmark Freelancer",
      role: "freelancer",
      skills: ["node.js", "api-design", "benchmarking"],
      hourlyRate: 85
    })
  },
  {
    name: "jobs-list",
    method: "GET",
    path: "/api/jobs",
    description: "Open jobs listing"
  },
  {
    name: "jobs-create",
    method: "POST",
    path: "/api/jobs",
    description: "Client job posting",
    payload: () => jsonPayload({
      title: "Build a secure payments dashboard",
      description: "Implement an authenticated dashboard with reporting, audit history, and payment status filters.",
      budgetMin: 1200,
      budgetMax: 3500,
      categoryId: "web-development",
      skills: ["react", "node.js", "payments"]
    })
  },
  {
    name: "proposals-list",
    method: "GET",
    path: "/api/proposals",
    description: "Proposal listing"
  },
  {
    name: "proposals-create",
    method: "POST",
    path: "/api/proposals",
    description: "Freelancer proposal submission",
    payload: () => jsonPayload({
      jobId: "job_benchmark",
      freelancerId: "usr_benchmark_freelancer",
      coverLetter: "I can deliver the requested secure payments dashboard with tests and deployment notes.",
      bidAmount: 2400,
      estimatedDays: 14
    })
  },
  {
    name: "payments-create",
    method: "POST",
    path: "/api/payments",
    description: "Payment intent creation",
    payload: () => jsonPayload({
      jobId: "job_benchmark",
      payerId: "usr_benchmark_client",
      payeeId: "usr_benchmark_freelancer",
      amount: 2400,
      currency: "usd"
    })
  },
  {
    name: "reviews-list",
    method: "GET",
    path: "/api/reviews",
    description: "Review listing"
  },
  {
    name: "reviews-create",
    method: "POST",
    path: "/api/reviews",
    description: "Completed contract review",
    payload: () => jsonPayload({
      contractId: "contract_benchmark",
      reviewerId: "usr_benchmark_client",
      revieweeId: "usr_benchmark_freelancer",
      rating: 5,
      comment: "Excellent communication, secure delivery, and complete documentation."
    })
  },
  {
    name: "messages-list",
    method: "GET",
    path: "/api/messages",
    description: "Message inbox listing"
  },
  {
    name: "messages-create",
    method: "POST",
    path: "/api/messages",
    description: "Conversation message creation",
    payload: () => jsonPayload({
      conversationId: "conversation_benchmark",
      senderId: "usr_benchmark_client",
      body: "Please share the next milestone status and any payment blockers."
    })
  },
  {
    name: "notifications-list",
    method: "GET",
    path: "/api/notifications",
    description: "Notification feed listing"
  },
  {
    name: "notifications-create",
    method: "POST",
    path: "/api/notifications",
    description: "Notification creation",
    payload: () => jsonPayload({
      userId: "usr_benchmark_client",
      type: "proposal_received",
      title: "New proposal received",
      body: "A freelancer submitted a proposal for your secure payments dashboard."
    })
  },
  {
    name: "uploads-create",
    method: "POST",
    path: "/api/uploads",
    description: "Small portfolio attachment upload",
    payload: uploadPayload
  },
  {
    name: "search",
    method: "GET",
    path: "/api/search?q=secure%20payments%20react",
    description: "Global search query"
  },
  {
    name: "admin-metrics",
    method: "GET",
    path: "/api/admin/metrics",
    description: "Auth-protected admin metrics",
    auth: true
  }
];
