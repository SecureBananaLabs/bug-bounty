function uniqueEmail(prefix, index) {
  return `${prefix}.${process.pid}.${Date.now()}.${index}@benchmark.local`;
}

function jsonBody(factory) {
  return ({ index }) => ({
    headers: { "content-type": "application/json" },
    body: JSON.stringify(factory(index))
  });
}

function uploadBody({ index }) {
  const form = new FormData();
  const content = [
    "FreelanceFlow benchmark upload",
    `sample=${index}`,
    "scope=api-smoke"
  ].join("\n");

  form.set(
    "file",
    new Blob([content], { type: "text/plain" }),
    `benchmark-${index}.txt`
  );

  return { body: form };
}

export const benchmarkEndpoints = [
  {
    id: "health",
    name: "Health check",
    method: "GET",
    path: "/health",
    routePath: "/health",
    expectedStatuses: [200],
    payloadProfile: "small health response"
  },
  {
    id: "auth-register",
    name: "Register user",
    method: "POST",
    path: "/api/auth/register",
    expectedStatuses: [201],
    payloadProfile: "client signup payload",
    buildRequest: jsonBody((index) => ({
      email: uniqueEmail("client", index),
      password: "benchmark-pass-123",
      role: "client"
    }))
  },
  {
    id: "auth-login",
    name: "Login user",
    method: "POST",
    path: "/api/auth/login",
    expectedStatuses: [200],
    payloadProfile: "existing user credential payload",
    buildRequest: jsonBody(() => ({
      email: "existing.client@benchmark.local",
      password: "benchmark-pass-123"
    }))
  },
  {
    id: "auth-oauth-callback",
    name: "OAuth callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback?code=benchmark-code&state=benchmark-state",
    routePath: "/api/auth/oauth/:provider/callback",
    expectedStatuses: [200],
    payloadProfile: "provider callback query"
  },
  {
    id: "auth-refresh",
    name: "Refresh token",
    method: "POST",
    path: "/api/auth/refresh",
    expectedStatuses: [200],
    payloadProfile: "empty refresh request"
  },
  {
    id: "users-list",
    name: "List users",
    method: "GET",
    path: "/api/users",
    routePath: "/api/users/",
    expectedStatuses: [200],
    payloadProfile: "collection read"
  },
  {
    id: "users-create",
    name: "Create user",
    method: "POST",
    path: "/api/users",
    routePath: "/api/users/",
    expectedStatuses: [201],
    payloadProfile: "freelancer profile payload",
    buildRequest: jsonBody((index) => ({
      email: uniqueEmail("freelancer", index),
      displayName: `Benchmark Freelancer ${index}`,
      role: "freelancer",
      skills: ["node", "react", "api-testing"]
    }))
  },
  {
    id: "jobs-list",
    name: "List jobs",
    method: "GET",
    path: "/api/jobs",
    routePath: "/api/jobs/",
    expectedStatuses: [200],
    payloadProfile: "collection read"
  },
  {
    id: "jobs-create",
    name: "Create job",
    method: "POST",
    path: "/api/jobs",
    routePath: "/api/jobs/",
    expectedStatuses: [201],
    payloadProfile: "production-sized job brief",
    buildRequest: jsonBody((index) => ({
      title: `Build benchmark dashboard ${index}`,
      description: "Create a dashboard that tracks marketplace API latency, proposal volume, and conversion signals for client teams.",
      budgetMin: 1500,
      budgetMax: 3500,
      categoryId: "analytics",
      skills: ["node", "typescript", "postgres", "observability"]
    }))
  },
  {
    id: "proposals-list",
    name: "List proposals",
    method: "GET",
    path: "/api/proposals",
    routePath: "/api/proposals/",
    expectedStatuses: [200],
    payloadProfile: "collection read"
  },
  {
    id: "proposals-create",
    name: "Create proposal",
    method: "POST",
    path: "/api/proposals",
    routePath: "/api/proposals/",
    expectedStatuses: [201],
    payloadProfile: "proposal submission payload",
    buildRequest: jsonBody((index) => ({
      jobId: `job_benchmark_${index}`,
      freelancerId: `usr_freelancer_${index}`,
      bidAmount: 2400,
      estimatedDays: 14,
      coverLetter: "I can deliver the API benchmark dashboard with documented thresholds, CI smoke coverage, and release notes."
    }))
  },
  {
    id: "payments-create",
    name: "Create payment intent",
    method: "POST",
    path: "/api/payments",
    routePath: "/api/payments/",
    expectedStatuses: [201],
    payloadProfile: "Stripe-style payment intent payload",
    buildRequest: jsonBody((index) => ({
      proposalId: `prp_benchmark_${index}`,
      amount: 240000,
      currency: "usd",
      metadata: {
        clientId: "usr_client_benchmark",
        jobId: `job_benchmark_${index}`
      }
    }))
  },
  {
    id: "reviews-list",
    name: "List reviews",
    method: "GET",
    path: "/api/reviews",
    routePath: "/api/reviews/",
    expectedStatuses: [200],
    payloadProfile: "collection read"
  },
  {
    id: "reviews-create",
    name: "Create review",
    method: "POST",
    path: "/api/reviews",
    routePath: "/api/reviews/",
    expectedStatuses: [201],
    payloadProfile: "completed contract review",
    buildRequest: jsonBody((index) => ({
      contractId: `contract_benchmark_${index}`,
      reviewerId: "usr_client_benchmark",
      revieweeId: "usr_freelancer_benchmark",
      rating: 5,
      comment: "Delivered the API benchmark suite with clear regression gates and reusable documentation."
    }))
  },
  {
    id: "messages-list",
    name: "List messages",
    method: "GET",
    path: "/api/messages",
    routePath: "/api/messages/",
    expectedStatuses: [200],
    payloadProfile: "collection read"
  },
  {
    id: "messages-create",
    name: "Send message",
    method: "POST",
    path: "/api/messages",
    routePath: "/api/messages/",
    expectedStatuses: [201],
    payloadProfile: "client/freelancer message",
    buildRequest: jsonBody((index) => ({
      threadId: `thread_benchmark_${index}`,
      senderId: "usr_client_benchmark",
      recipientId: "usr_freelancer_benchmark",
      body: "Can you share the benchmark report and the p99 threshold settings before handoff?"
    }))
  },
  {
    id: "notifications-list",
    name: "List notifications",
    method: "GET",
    path: "/api/notifications",
    routePath: "/api/notifications/",
    expectedStatuses: [200],
    payloadProfile: "collection read"
  },
  {
    id: "notifications-create",
    name: "Create notification",
    method: "POST",
    path: "/api/notifications",
    routePath: "/api/notifications/",
    expectedStatuses: [201],
    payloadProfile: "notification payload",
    buildRequest: jsonBody((index) => ({
      userId: "usr_client_benchmark",
      type: "proposal_submitted",
      message: `Benchmark proposal ${index} is ready for review.`
    }))
  },
  {
    id: "uploads-create",
    name: "Upload file",
    method: "POST",
    path: "/api/uploads",
    routePath: "/api/uploads/",
    expectedStatuses: [201],
    payloadProfile: "multipart text attachment",
    buildRequest: uploadBody
  },
  {
    id: "search",
    name: "Search marketplace",
    method: "GET",
    path: "/api/search?q=react%20api%20benchmark",
    routePath: "/api/search/",
    expectedStatuses: [200],
    payloadProfile: "search query"
  },
  {
    id: "admin-metrics",
    name: "Admin metrics",
    method: "GET",
    path: "/api/admin/metrics",
    expectedStatuses: [200],
    auth: "benchmark-admin",
    payloadProfile: "protected metrics read"
  }
];

export function endpointRouteKey(endpoint) {
  return `${endpoint.method.toUpperCase()} ${endpoint.routePath ?? endpoint.path.split("?")[0]}`;
}
