export const API_ROUTES = [
  {
    id: "health",
    method: "GET",
    path: "/health",
    pathTemplate: "/health",
    description: "Service liveness check",
    expectedStatus: 200
  },
  {
    id: "auth-register",
    method: "POST",
    path: "/api/auth/register",
    pathTemplate: "/api/auth/register",
    description: "Register a benchmark client user",
    expectedStatus: 201,
    json: (index) => ({
      email: `bench-client-${Date.now()}-${index}@example.com`,
      password: "benchmark-password",
      role: "client"
    })
  },
  {
    id: "auth-login",
    method: "POST",
    path: "/api/auth/login",
    pathTemplate: "/api/auth/login",
    description: "Login with representative credentials",
    expectedStatus: 200,
    json: () => ({
      email: "benchmark@example.com",
      password: "benchmark-password"
    })
  },
  {
    id: "auth-refresh",
    method: "POST",
    path: "/api/auth/refresh",
    pathTemplate: "/api/auth/refresh",
    description: "Refresh an access token",
    expectedStatus: 200
  },
  {
    id: "auth-oauth-callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback",
    pathTemplate: "/api/auth/oauth/:provider/callback",
    description: "OAuth callback acknowledgement",
    expectedStatus: 200
  },
  {
    id: "users-list",
    method: "GET",
    path: "/api/users",
    pathTemplate: "/api/users/",
    description: "List users",
    expectedStatus: 200
  },
  {
    id: "users-create",
    method: "POST",
    path: "/api/users",
    pathTemplate: "/api/users/",
    description: "Create a representative user profile",
    expectedStatus: 201,
    json: (index) => ({
      name: `Benchmark User ${index}`,
      email: `bench-user-${Date.now()}-${index}@example.com`,
      role: index % 2 === 0 ? "client" : "freelancer",
      status: "active",
      bio: "Benchmark profile seeded with realistic text length for API regression tracking."
    })
  },
  {
    id: "jobs-list",
    method: "GET",
    path: "/api/jobs",
    pathTemplate: "/api/jobs/",
    description: "List jobs",
    expectedStatus: 200
  },
  {
    id: "jobs-create",
    method: "POST",
    path: "/api/jobs",
    pathTemplate: "/api/jobs/",
    description: "Create a representative marketplace job",
    expectedStatus: 201,
    json: (index) => ({
      title: `Benchmark API integration build ${index}`,
      description:
        "Build a production-ready integration with validation, webhook handling, retries, and clear operational docs.",
      budgetMin: 750,
      budgetMax: 2500,
      categoryId: "cat_web_development",
      skills: ["node", "express", "api", "testing"]
    })
  },
  {
    id: "proposals-list",
    method: "GET",
    path: "/api/proposals",
    pathTemplate: "/api/proposals/",
    description: "List proposals",
    expectedStatus: 200
  },
  {
    id: "proposals-create",
    method: "POST",
    path: "/api/proposals",
    pathTemplate: "/api/proposals/",
    description: "Submit a representative proposal",
    expectedStatus: 201,
    json: (index) => ({
      jobId: `job_benchmark_${index}`,
      freelancerId: `usr_freelancer_${index}`,
      amount: 1200,
      timelineDays: 5,
      coverLetter:
        "I can deliver the integration with endpoint tests, retry handling, and a concise deployment checklist."
    })
  },
  {
    id: "payments-create",
    method: "POST",
    path: "/api/payments",
    pathTemplate: "/api/payments/",
    description: "Create a payment intent",
    expectedStatus: 201,
    json: (index) => ({
      jobId: `job_benchmark_${index}`,
      amount: 1200,
      currency: "usd",
      payerId: `usr_client_${index}`
    })
  },
  {
    id: "reviews-list",
    method: "GET",
    path: "/api/reviews",
    pathTemplate: "/api/reviews/",
    description: "List reviews",
    expectedStatus: 200
  },
  {
    id: "reviews-create",
    method: "POST",
    path: "/api/reviews",
    pathTemplate: "/api/reviews/",
    description: "Create a representative review",
    expectedStatus: 201,
    json: (index) => ({
      jobId: `job_benchmark_${index}`,
      reviewerId: `usr_client_${index}`,
      revieweeId: `usr_freelancer_${index}`,
      rating: 5,
      comment: "Fast, clear delivery with strong tests and useful handoff notes."
    })
  },
  {
    id: "messages-list",
    method: "GET",
    path: "/api/messages",
    pathTemplate: "/api/messages/",
    description: "List messages",
    expectedStatus: 200
  },
  {
    id: "messages-create",
    method: "POST",
    path: "/api/messages",
    pathTemplate: "/api/messages/",
    description: "Send a representative project message",
    expectedStatus: 201,
    json: (index) => ({
      threadId: `thread_benchmark_${index}`,
      senderId: `usr_client_${index}`,
      recipientId: `usr_freelancer_${index}`,
      body: "Can you confirm the API retry behavior and include the benchmark summary in the handoff?"
    })
  },
  {
    id: "notifications-list",
    method: "GET",
    path: "/api/notifications",
    pathTemplate: "/api/notifications/",
    description: "List notifications",
    expectedStatus: 200
  },
  {
    id: "notifications-create",
    method: "POST",
    path: "/api/notifications",
    pathTemplate: "/api/notifications/",
    description: "Create a representative notification",
    expectedStatus: 201,
    json: (index) => ({
      userId: `usr_client_${index}`,
      type: "proposal_received",
      title: "New proposal received",
      body: "A freelancer submitted a proposal for your benchmark API integration job."
    })
  },
  {
    id: "uploads-create",
    method: "POST",
    path: "/api/uploads",
    pathTemplate: "/api/uploads/",
    description: "Upload a small representative attachment",
    expectedStatus: 201,
    multipart: {
      fieldName: "file",
      filename: "benchmark-brief.txt",
      contentType: "text/plain",
      content:
        "Benchmark attachment body that simulates a short project brief uploaded by a client."
    }
  },
  {
    id: "search-global",
    method: "GET",
    path: "/api/search?q=benchmark%20api%20developer",
    pathTemplate: "/api/search/",
    description: "Run global search with a realistic query",
    expectedStatus: 200
  },
  {
    id: "admin-metrics",
    method: "GET",
    path: "/api/admin/metrics",
    pathTemplate: "/api/admin/metrics",
    description: "Fetch protected admin metrics with benchmark token",
    expectedStatus: 200,
    auth: "admin"
  }
];

export function routeLabels() {
  return API_ROUTES.map((route) => `${route.method} ${route.pathTemplate}`);
}
