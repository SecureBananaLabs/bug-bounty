export const benchmarkRoutes = [
  {
    id: "health",
    method: "GET",
    path: "/health",
    expectedStatuses: [200],
    description: "API health check"
  },
  {
    id: "auth-register",
    method: "POST",
    path: "/api/auth/register",
    body: () => ({
      email: `benchmark-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
      password: "benchmark-password-123",
      role: "client"
    }),
    expectedStatuses: [201],
    description: "Register a client-sized account payload"
  },
  {
    id: "auth-login",
    method: "POST",
    path: "/api/auth/login",
    body: () => ({
      email: "benchmark@example.com",
      password: "benchmark-password-123"
    }),
    expectedStatuses: [200],
    description: "Login payload with email and password"
  },
  {
    id: "auth-oauth-callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback",
    expectedStatuses: [200],
    description: "OAuth callback route with provider path parameter"
  },
  {
    id: "auth-refresh",
    method: "POST",
    path: "/api/auth/refresh",
    expectedStatuses: [200],
    description: "Refresh an access token"
  },
  {
    id: "users-list",
    method: "GET",
    path: "/api/users",
    expectedStatuses: [200],
    description: "List users"
  },
  {
    id: "users-create",
    method: "POST",
    path: "/api/users",
    body: () => ({
      name: "Benchmark Client",
      email: `client-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
      role: "client",
      company: "Benchmark Labs",
      bio: "Synthetic benchmark user payload sized like a normal profile record."
    }),
    expectedStatuses: [201],
    description: "Create user with representative profile fields"
  },
  {
    id: "jobs-list",
    method: "GET",
    path: "/api/jobs",
    expectedStatuses: [200],
    description: "List jobs"
  },
  {
    id: "jobs-create",
    method: "POST",
    path: "/api/jobs",
    body: () => ({
      title: "Benchmark landing page build",
      description: "Build a conversion-focused landing page with analytics, forms, and responsive UI for benchmark load testing.",
      budgetMin: 1500,
      budgetMax: 3500,
      categoryId: "web-development",
      skills: ["nextjs", "typescript", "tailwind", "analytics"]
    }),
    expectedStatuses: [201],
    description: "Create job with realistic title, description, budget, category, and skills"
  },
  {
    id: "proposals-list",
    method: "GET",
    path: "/api/proposals",
    expectedStatuses: [200],
    description: "List proposals"
  },
  {
    id: "proposals-create",
    method: "POST",
    path: "/api/proposals",
    body: () => ({
      jobId: "job_benchmark",
      freelancerId: "usr_benchmark_freelancer",
      coverLetter: "I can deliver this benchmark project with a clear milestone plan, test coverage, and weekly reporting.",
      amount: 2400,
      timelineDays: 14
    }),
    expectedStatuses: [201],
    description: "Create proposal with project, freelancer, cover letter, amount, and timeline"
  },
  {
    id: "payments-create",
    method: "POST",
    path: "/api/payments",
    body: () => ({
      jobId: "job_benchmark",
      amount: 240000,
      currency: "usd",
      paymentMethod: "card",
      customerId: "cus_benchmark"
    }),
    expectedStatuses: [201],
    description: "Create payment intent-sized payload"
  },
  {
    id: "reviews-list",
    method: "GET",
    path: "/api/reviews",
    expectedStatuses: [200],
    description: "List reviews"
  },
  {
    id: "reviews-create",
    method: "POST",
    path: "/api/reviews",
    body: () => ({
      jobId: "job_benchmark",
      reviewerId: "usr_benchmark_client",
      revieweeId: "usr_benchmark_freelancer",
      rating: 5,
      comment: "Fast delivery, clear communication, and high-quality implementation."
    }),
    expectedStatuses: [201],
    description: "Create review payload"
  },
  {
    id: "messages-list",
    method: "GET",
    path: "/api/messages",
    expectedStatuses: [200],
    description: "List messages"
  },
  {
    id: "messages-create",
    method: "POST",
    path: "/api/messages",
    body: () => ({
      conversationId: "conv_benchmark",
      senderId: "usr_benchmark_client",
      recipientId: "usr_benchmark_freelancer",
      body: "Can you confirm the milestone delivery date and share the first preview when ready?"
    }),
    expectedStatuses: [201],
    description: "Create message payload"
  },
  {
    id: "notifications-list",
    method: "GET",
    path: "/api/notifications",
    expectedStatuses: [200],
    description: "List notifications"
  },
  {
    id: "notifications-create",
    method: "POST",
    path: "/api/notifications",
    body: () => ({
      userId: "usr_benchmark_client",
      type: "proposal_received",
      title: "New proposal received",
      message: "A freelancer submitted a proposal for your benchmark project.",
      read: false
    }),
    expectedStatuses: [201],
    description: "Create notification payload"
  },
  {
    id: "uploads-create",
    method: "POST",
    path: "/api/uploads",
    multipart: () => ({
      fields: { purpose: "benchmark" },
      file: {
        fieldName: "file",
        filename: "benchmark.txt",
        contentType: "text/plain",
        content: "Synthetic benchmark upload fixture.\n".repeat(16)
      }
    }),
    expectedStatuses: [201],
    description: "Multipart upload with small text attachment"
  },
  {
    id: "search-global",
    method: "GET",
    path: "/api/search?q=nextjs%20landing%20page",
    expectedStatuses: [200],
    description: "Global search with representative query text"
  },
  {
    id: "admin-metrics",
    method: "GET",
    path: "/api/admin/metrics",
    auth: true,
    expectedStatuses: [200],
    description: "Auth-protected admin metrics using benchmark token"
  }
];
