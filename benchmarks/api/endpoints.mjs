const jsonHeaders = {
  "Content-Type": "application/json"
};

function jsonBody(payload) {
  return {
    headers: { ...jsonHeaders },
    body: JSON.stringify(payload)
  };
}

function multipartBody({ fields = {}, files = [] }) {
  const boundary = `benchmark-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const chunks = [];

  for (const [name, value] of Object.entries(fields)) {
    chunks.push(`--${boundary}\r\n`);
    chunks.push(`Content-Disposition: form-data; name="${name}"\r\n\r\n`);
    chunks.push(`${value}\r\n`);
  }

  for (const file of files) {
    chunks.push(`--${boundary}\r\n`);
    chunks.push(`Content-Disposition: form-data; name="${file.fieldName}"; filename="${file.fileName}"\r\n`);
    chunks.push(`Content-Type: ${file.contentType ?? "application/octet-stream"}\r\n\r\n`);
    chunks.push(file.content);
    chunks.push("\r\n");
  }

  chunks.push(`--${boundary}--\r\n`);

  return {
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`
    },
    body: Buffer.from(chunks.join(""), "utf8")
  };
}

function withAuth(request, context) {
  return {
    ...request,
    headers: {
      ...(request.headers ?? {}),
      Authorization: `Bearer ${context.adminToken}`
    }
  };
}

export const endpointRegistry = [
  {
    id: "health.check",
    method: "GET",
    path: "/health",
    routePattern: "/health",
    expectedStatus: 200,
    description: "Service health check",
    request: () => ({})
  },
  {
    id: "auth.register",
    method: "POST",
    path: "/api/auth/register",
    routePattern: "/api/auth/register",
    expectedStatus: 201,
    description: "Client registration with benchmark-sized credential payload",
    request: (context) => jsonBody({
      email: `benchmark-client-${context.requestId ?? context.runId}@example.com`,
      password: "BenchmarkPass123!",
      role: "client"
    })
  },
  {
    id: "auth.login",
    method: "POST",
    path: "/api/auth/login",
    routePattern: "/api/auth/login",
    expectedStatus: 200,
    description: "Client login using a realistic email/password body",
    request: () => jsonBody({
      email: "benchmark-client@example.com",
      password: "BenchmarkPass123!"
    })
  },
  {
    id: "auth.oauth.callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback",
    routePattern: "/api/auth/oauth/:provider/callback",
    expectedStatus: 200,
    description: "OAuth callback route using the GitHub provider parameter",
    request: () => ({})
  },
  {
    id: "auth.refresh",
    method: "POST",
    path: "/api/auth/refresh",
    routePattern: "/api/auth/refresh",
    expectedStatus: 200,
    description: "Refresh-token flow placeholder endpoint",
    request: () => jsonBody({
      refreshToken: "benchmark-refresh-token"
    })
  },
  {
    id: "users.list",
    method: "GET",
    path: "/api/users",
    routePattern: "/api/users",
    expectedStatus: 200,
    description: "List users collection",
    request: () => ({})
  },
  {
    id: "users.create",
    method: "POST",
    path: "/api/users",
    routePattern: "/api/users",
    expectedStatus: 201,
    description: "Create a freelancer user profile payload",
    request: (context) => jsonBody({
      email: `benchmark-freelancer-${context.requestId ?? context.runId}@example.com`,
      name: "Benchmark Freelancer",
      role: "freelancer",
      location: "Remote",
      skills: ["node.js", "performance", "api testing"],
      hourlyRate: 85
    })
  },
  {
    id: "jobs.list",
    method: "GET",
    path: "/api/jobs",
    routePattern: "/api/jobs",
    expectedStatus: 200,
    description: "List open jobs",
    request: () => ({})
  },
  {
    id: "jobs.create",
    method: "POST",
    path: "/api/jobs",
    routePattern: "/api/jobs",
    expectedStatus: 201,
    description: "Create a project brief with production-schema-sized fields",
    request: () => jsonBody({
      title: "Build a benchmark-ready API dashboard",
      description: "Create a production-ready analytics dashboard that summarizes marketplace API activity, conversion events, and operational health for platform administrators.",
      budgetMin: 2500,
      budgetMax: 7500,
      categoryId: "cat_software_engineering",
      skills: ["node.js", "next.js", "api performance", "observability", "typescript"]
    })
  },
  {
    id: "proposals.list",
    method: "GET",
    path: "/api/proposals",
    routePattern: "/api/proposals",
    expectedStatus: 200,
    description: "List proposals",
    request: () => ({})
  },
  {
    id: "proposals.create",
    method: "POST",
    path: "/api/proposals",
    routePattern: "/api/proposals",
    expectedStatus: 201,
    description: "Create a realistic freelancer proposal",
    request: () => jsonBody({
      jobId: "job_benchmark_api_dashboard",
      freelancerId: "usr_benchmark_freelancer",
      coverLetter: "I can deliver the API benchmark dashboard with validated metrics, automated regression checks, and concise reporting for engineering review.",
      bidAmount: 4200,
      estimatedDays: 14,
      milestones: [
        { name: "Data model and API integration", amount: 1200 },
        { name: "Dashboard implementation", amount: 2000 },
        { name: "Validation and handoff", amount: 1000 }
      ]
    })
  },
  {
    id: "payments.create",
    method: "POST",
    path: "/api/payments",
    routePattern: "/api/payments",
    expectedStatus: 201,
    description: "Create a payment intent placeholder",
    request: () => jsonBody({
      proposalId: "prp_benchmark_dashboard",
      amount: 4200,
      currency: "usd",
      paymentMethod: "card",
      escrow: true
    })
  },
  {
    id: "reviews.list",
    method: "GET",
    path: "/api/reviews",
    routePattern: "/api/reviews",
    expectedStatus: 200,
    description: "List reviews",
    request: () => ({})
  },
  {
    id: "reviews.create",
    method: "POST",
    path: "/api/reviews",
    routePattern: "/api/reviews",
    expectedStatus: 201,
    description: "Create a marketplace review payload",
    request: () => jsonBody({
      jobId: "job_benchmark_api_dashboard",
      reviewerId: "usr_benchmark_client",
      revieweeId: "usr_benchmark_freelancer",
      rating: 5,
      comment: "Delivered clear benchmark reports, good communication, and production-ready automation."
    })
  },
  {
    id: "messages.list",
    method: "GET",
    path: "/api/messages",
    routePattern: "/api/messages",
    expectedStatus: 200,
    description: "List message thread payloads",
    request: () => ({})
  },
  {
    id: "messages.create",
    method: "POST",
    path: "/api/messages",
    routePattern: "/api/messages",
    expectedStatus: 201,
    description: "Create a client-to-freelancer message",
    request: () => jsonBody({
      conversationId: "cnv_benchmark_dashboard",
      senderId: "usr_benchmark_client",
      recipientId: "usr_benchmark_freelancer",
      body: "Can you share the latest benchmark report and highlight any endpoint breaching the p99 threshold?"
    })
  },
  {
    id: "notifications.list",
    method: "GET",
    path: "/api/notifications",
    routePattern: "/api/notifications",
    expectedStatus: 200,
    description: "List notifications",
    request: () => ({})
  },
  {
    id: "notifications.create",
    method: "POST",
    path: "/api/notifications",
    routePattern: "/api/notifications",
    expectedStatus: 201,
    description: "Create an operational notification",
    request: () => jsonBody({
      userId: "usr_benchmark_client",
      type: "benchmark_report_ready",
      title: "Benchmark report is ready",
      message: "The latest API benchmark suite completed successfully with no threshold breaches.",
      priority: "normal"
    })
  },
  {
    id: "uploads.create",
    method: "POST",
    path: "/api/uploads",
    routePattern: "/api/uploads",
    expectedStatus: 201,
    description: "Upload a small benchmark attachment using multipart/form-data",
    request: () => multipartBody({
      fields: {
        purpose: "benchmark-fixture"
      },
      files: [
        {
          fieldName: "file",
          fileName: "benchmark-brief.txt",
          contentType: "text/plain",
          content: "Synthetic benchmark upload fixture for API load testing.\n"
        }
      ]
    })
  },
  {
    id: "search.query",
    method: "GET",
    path: "/api/search?q=performance%20dashboard%20node",
    routePattern: "/api/search",
    expectedStatus: 200,
    description: "Global search with a realistic marketplace query",
    request: () => ({})
  },
  {
    id: "admin.metrics",
    method: "GET",
    path: "/api/admin/metrics",
    routePattern: "/api/admin/metrics",
    expectedStatus: 200,
    description: "Protected admin metrics with benchmark-only JWT",
    request: (_context) => ({}),
    authorize: withAuth
  }
];

export function buildRequest(endpoint, context) {
  const baseRequest = endpoint.request(context);
  return endpoint.authorize ? endpoint.authorize(baseRequest, context) : baseRequest;
}
