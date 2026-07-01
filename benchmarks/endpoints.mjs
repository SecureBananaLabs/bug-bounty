export const benchmarkEndpoints = [
  {
    name: "health-check",
    method: "GET",
    path: "/health",
    expectedStatus: 200,
    scenario: "Public health probe used by uptime checks and deployment smoke tests."
  },
  {
    name: "auth-register-client",
    method: "POST",
    path: "/api/auth/register",
    expectedStatus: 201,
    scenario: "Client creates a new account before posting freelance work.",
    json: ({ nextId }) => ({
      email: `benchmark.client.${nextId()}@example.com`,
      password: "benchmark-pass-123",
      role: "client"
    })
  },
  {
    name: "auth-login-client",
    method: "POST",
    path: "/api/auth/login",
    expectedStatus: 200,
    scenario: "Existing client signs in with email and password.",
    json: () => ({
      email: "benchmark.client@example.com",
      password: "benchmark-pass-123"
    })
  },
  {
    name: "auth-oauth-callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback",
    expectedStatus: 200,
    scenario: "OAuth provider callback reaches the API callback endpoint."
  },
  {
    name: "auth-refresh-token",
    method: "POST",
    path: "/api/auth/refresh",
    expectedStatus: 200,
    scenario: "Authenticated session requests a refreshed access token."
  },
  {
    name: "users-list",
    method: "GET",
    path: "/api/users",
    expectedStatus: 200,
    scenario: "Directory view loads users for marketplace discovery."
  },
  {
    name: "users-create-freelancer",
    method: "POST",
    path: "/api/users",
    expectedStatus: 201,
    scenario: "Freelancer profile is created with portfolio metadata.",
    json: ({ nextId }) => ({
      email: `benchmark.freelancer.${nextId()}@example.com`,
      name: "Benchmark Freelancer",
      role: "freelancer",
      skills: ["node.js", "api performance", "sql"],
      hourlyRate: 85
    })
  },
  {
    name: "jobs-list",
    method: "GET",
    path: "/api/jobs",
    expectedStatus: 200,
    scenario: "Marketplace job list is loaded by a freelancer browsing work."
  },
  {
    name: "jobs-create",
    method: "POST",
    path: "/api/jobs",
    expectedStatus: 201,
    scenario: "Client posts a realistic API performance optimisation job.",
    json: ({ nextId }) => ({
      title: `Benchmark API optimisation ${nextId()}`,
      description: "Audit API latency, add dashboard metrics, and reduce p95 response time for high-traffic endpoints.",
      budgetMin: 750,
      budgetMax: 2500,
      categoryId: "cat_api_engineering",
      skills: ["node.js", "express", "benchmarking", "observability"]
    })
  },
  {
    name: "proposals-list",
    method: "GET",
    path: "/api/proposals",
    expectedStatus: 200,
    scenario: "Client reviews proposals submitted for open work."
  },
  {
    name: "proposals-create",
    method: "POST",
    path: "/api/proposals",
    expectedStatus: 201,
    scenario: "Freelancer submits a detailed proposal against a job.",
    json: ({ nextId }) => ({
      jobId: `job_benchmark_${nextId()}`,
      freelancerId: "usr_benchmark_freelancer",
      coverLetter: "I will profile the critical API routes, publish reproducible results, and tune the slowest handlers.",
      bidAmount: 1200,
      deliveryDays: 5
    })
  },
  {
    name: "payments-create",
    method: "POST",
    path: "/api/payments",
    expectedStatus: 201,
    scenario: "Client opens an escrow-style payment intent for accepted work.",
    json: ({ nextId }) => ({
      proposalId: `prp_benchmark_${nextId()}`,
      amount: 1200,
      currency: "usd",
      customerId: "cus_benchmark_client"
    })
  },
  {
    name: "reviews-list",
    method: "GET",
    path: "/api/reviews",
    expectedStatus: 200,
    scenario: "Public profile loads completed-work reviews."
  },
  {
    name: "reviews-create",
    method: "POST",
    path: "/api/reviews",
    expectedStatus: 201,
    scenario: "Client leaves a post-project review for a freelancer.",
    json: ({ nextId }) => ({
      contractId: `ctr_benchmark_${nextId()}`,
      reviewerId: "usr_benchmark_client",
      revieweeId: "usr_benchmark_freelancer",
      rating: 5,
      comment: "Delivered the benchmark report quickly with clear latency improvements."
    })
  },
  {
    name: "messages-list",
    method: "GET",
    path: "/api/messages",
    expectedStatus: 200,
    scenario: "Conversation pane fetches project messages."
  },
  {
    name: "messages-create",
    method: "POST",
    path: "/api/messages",
    expectedStatus: 201,
    scenario: "Client sends project clarification to a freelancer.",
    json: ({ nextId }) => ({
      threadId: `thr_benchmark_${nextId()}`,
      senderId: "usr_benchmark_client",
      recipientId: "usr_benchmark_freelancer",
      body: "Please include p50, p95, p99, sustained RPS, peak RPS, error rate, and TTFB in the report."
    })
  },
  {
    name: "notifications-list",
    method: "GET",
    path: "/api/notifications",
    expectedStatus: 200,
    scenario: "User notification drawer loads recent events."
  },
  {
    name: "notifications-create",
    method: "POST",
    path: "/api/notifications",
    expectedStatus: 201,
    scenario: "System creates a notification for a new proposal.",
    json: ({ nextId }) => ({
      userId: "usr_benchmark_client",
      type: "proposal_received",
      title: "New benchmark proposal received",
      body: `Proposal ${nextId()} includes latency and throughput reporting.`
    })
  },
  {
    name: "uploads-create",
    method: "POST",
    path: "/api/uploads",
    expectedStatus: 201,
    scenario: "Freelancer uploads a small project artefact.",
    multipart: ({ nextId }) => ({
      files: [
        {
          field: "file",
          filename: `benchmark-report-${nextId()}.txt`,
          type: "text/plain",
          content: "Synthetic benchmark upload payload for API coverage.\n"
        }
      ]
    })
  },
  {
    name: "search-global",
    method: "GET",
    path: "/api/search?q=api%20benchmark",
    expectedStatus: 200,
    scenario: "Global search looks for API benchmark related marketplace data."
  },
  {
    name: "admin-metrics",
    method: "GET",
    path: "/api/admin/metrics",
    expectedStatus: 200,
    auth: "admin",
    scenario: "Admin user loads platform metrics with a dedicated benchmark token."
  }
];
