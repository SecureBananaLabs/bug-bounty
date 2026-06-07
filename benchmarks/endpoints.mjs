export const endpoints = [
  {
    id: "health",
    name: "Health check",
    method: "GET",
    path: "/health",
    expectedStatuses: [200]
  },
  {
    id: "auth-register",
    name: "Register user",
    method: "POST",
    path: "/api/auth/register",
    expectedStatuses: [201],
    body: ({ requestIndex }) => ({
      email: `bench-${Date.now()}-${requestIndex}@example.com`,
      password: "benchmark-pass",
      role: requestIndex % 2 === 0 ? "client" : "freelancer"
    })
  },
  {
    id: "auth-login",
    name: "Login user",
    method: "POST",
    path: "/api/auth/login",
    expectedStatuses: [200],
    body: () => ({
      email: "benchmark-user@example.com",
      password: "benchmark-pass"
    })
  },
  {
    id: "auth-oauth-callback",
    name: "OAuth callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback",
    expectedStatuses: [200]
  },
  {
    id: "auth-refresh",
    name: "Refresh token",
    method: "POST",
    path: "/api/auth/refresh",
    expectedStatuses: [200],
    body: () => ({ refreshToken: "benchmark-refresh-token" })
  },
  {
    id: "users-list",
    name: "List users",
    method: "GET",
    path: "/api/users",
    expectedStatuses: [200]
  },
  {
    id: "users-create",
    name: "Create user",
    method: "POST",
    path: "/api/users",
    expectedStatuses: [201],
    body: ({ requestIndex }) => ({
      email: `api-user-${Date.now()}-${requestIndex}@example.com`,
      name: "Benchmark User",
      role: "freelancer",
      bio: "Freelance API benchmark profile with realistic text payload size.",
      skills: ["typescript", "react", "api-performance"]
    })
  },
  {
    id: "jobs-list",
    name: "List jobs",
    method: "GET",
    path: "/api/jobs",
    expectedStatuses: [200]
  },
  {
    id: "jobs-create",
    name: "Create job",
    method: "POST",
    path: "/api/jobs",
    expectedStatuses: [201],
    body: ({ requestIndex }) => ({
      title: `Benchmark Marketplace API Build ${requestIndex}`,
      description: "Build a production-ready marketplace API module with authentication, search, messaging, and performance instrumentation.",
      budgetMin: 500,
      budgetMax: 2500,
      categoryId: "cat_api",
      skills: ["node", "express", "postgres", "performance"]
    })
  },
  {
    id: "proposals-list",
    name: "List proposals",
    method: "GET",
    path: "/api/proposals",
    expectedStatuses: [200]
  },
  {
    id: "proposals-create",
    name: "Create proposal",
    method: "POST",
    path: "/api/proposals",
    expectedStatuses: [201],
    body: ({ requestIndex }) => ({
      jobId: `job_benchmark_${requestIndex}`,
      freelancerId: "usr_benchmark_freelancer",
      coverLetter: "I can deliver the API feature with measured performance, tests, and production-ready documentation.",
      bidAmount: 1400,
      estimatedDays: 7
    })
  },
  {
    id: "payments-create",
    name: "Create payment",
    method: "POST",
    path: "/api/payments",
    expectedStatuses: [201],
    body: ({ requestIndex }) => ({
      proposalId: `prp_benchmark_${requestIndex}`,
      amount: 1400,
      currency: "usd",
      description: "Benchmark escrow payment intent"
    })
  },
  {
    id: "reviews-list",
    name: "List reviews",
    method: "GET",
    path: "/api/reviews",
    expectedStatuses: [200]
  },
  {
    id: "reviews-create",
    name: "Create review",
    method: "POST",
    path: "/api/reviews",
    expectedStatuses: [201],
    body: ({ requestIndex }) => ({
      contractId: `ctr_benchmark_${requestIndex}`,
      reviewerId: "usr_benchmark_client",
      revieweeId: "usr_benchmark_freelancer",
      rating: 5,
      comment: "Clear communication, reliable delivery, and measurable API performance improvements."
    })
  },
  {
    id: "messages-list",
    name: "List messages",
    method: "GET",
    path: "/api/messages",
    expectedStatuses: [200]
  },
  {
    id: "messages-create",
    name: "Create message",
    method: "POST",
    path: "/api/messages",
    expectedStatuses: [201],
    body: ({ requestIndex }) => ({
      conversationId: `conv_benchmark_${requestIndex % 5}`,
      senderId: "usr_benchmark_client",
      recipientId: "usr_benchmark_freelancer",
      message: "Can you share the latest milestone and benchmark evidence for the API work?"
    })
  },
  {
    id: "notifications-list",
    name: "List notifications",
    method: "GET",
    path: "/api/notifications",
    expectedStatuses: [200]
  },
  {
    id: "notifications-create",
    name: "Create notification",
    method: "POST",
    path: "/api/notifications",
    expectedStatuses: [201],
    body: ({ requestIndex }) => ({
      userId: "usr_benchmark_client",
      type: "proposal_received",
      title: "New proposal received",
      message: `Benchmark notification payload ${requestIndex}`
    })
  },
  {
    id: "uploads-create",
    name: "Upload file",
    method: "POST",
    path: "/api/uploads",
    expectedStatuses: [201],
    formData: ({ requestIndex }) => {
      const formData = new FormData();
      const content = `benchmark file payload ${requestIndex}\n${"x".repeat(2048)}`;
      formData.append("file", new Blob([content], { type: "text/plain" }), `benchmark-${requestIndex}.txt`);
      return formData;
    }
  },
  {
    id: "search",
    name: "Search",
    method: "GET",
    path: "/api/search?q=typescript%20marketplace%20api",
    expectedStatuses: [200]
  },
  {
    id: "admin-metrics",
    name: "Admin metrics",
    method: "GET",
    path: "/api/admin/metrics",
    expectedStatuses: [200],
    auth: true
  }
];
