export function createEndpoints() {
  const defaultPassword = process.env.BENCHMARK_PASSWORD ?? "benchmark-password-123";
  const defaultEmail = process.env.BENCHMARK_EMAIL ?? "benchmark@example.test";
  const userId = process.env.BENCHMARK_USER_ID ?? "benchmark-user-id";
  const jobId = process.env.BENCHMARK_JOB_ID ?? "benchmark-job-id";
  const categoryId = process.env.BENCHMARK_CATEGORY_ID ?? "benchmark-category-id";

  return [
    {
      method: "POST",
      path: "/api/auth/register",
      body: () => ({
        email: defaultEmail,
        password: defaultPassword,
        role: "client"
      })
    },
    {
      method: "POST",
      path: "/api/auth/login",
      body: () => ({ email: defaultEmail, password: defaultPassword })
    },
    {
      method: "GET",
      path: "/api/auth/oauth/github/callback"
    },
    {
      method: "POST",
      path: "/api/auth/refresh",
      body: () => ({})
    },
    {
      method: "GET",
      path: "/api/users/"
    },
    {
      method: "POST",
      path: "/api/users/",
      body: () => ({
        email: defaultEmail,
        fullName: "Benchmark User",
        bio: "A representative benchmark user profile.",
        role: "CLIENT"
      })
    },
    {
      method: "GET",
      path: "/api/jobs/"
    },
    {
      method: "POST",
      path: "/api/jobs/",
      body: () => ({
        title: "Benchmark API integration",
        description: "Implement a representative API integration for benchmark traffic.",
        budgetMin: 500,
        budgetMax: 1500,
        categoryId,
        skills: ["javascript", "api-design"]
      })
    },
    {
      method: "GET",
      path: "/api/proposals/"
    },
    {
      method: "POST",
      path: "/api/proposals/",
      body: () => ({
        coverLetter: "I can deliver this integration with tests and documentation.",
        bidAmount: 900,
        estDuration: "2 weeks",
        jobId,
        freelancerId: userId
      })
    },
    {
      method: "POST",
      path: "/api/payments/",
      body: () => ({
        amount: 900,
        currency: "usd",
        status: "pending",
        jobId
      })
    },
    {
      method: "GET",
      path: "/api/reviews/"
    },
    {
      method: "POST",
      path: "/api/reviews/",
      body: () => ({
        rating: 5,
        comment: "Clear communication and high-quality delivery.",
        reviewerId: userId,
        revieweeId: userId
      })
    },
    {
      method: "GET",
      path: "/api/messages/"
    },
    {
      method: "POST",
      path: "/api/messages/",
      body: () => ({
        body: "The benchmark fixture message contains a representative payload.",
        senderId: userId,
        receiverId: userId,
        isRead: false
      })
    },
    {
      method: "GET",
      path: "/api/notifications/"
    },
    {
      method: "POST",
      path: "/api/notifications/",
      body: () => ({
        userId,
        title: "Benchmark notification",
        body: "A representative notification body for API testing.",
        read: false
      })
    },
    {
      method: "POST",
      path: "/api/uploads/",
      body: () => ({
        type: "multipart",
        fields: { description: "Representative benchmark upload" },
        file: {
          field: "file",
          filename: "benchmark.txt",
          contentType: "text/plain",
          content: "Representative benchmark upload payload.\n"
        }
      })
    },
    {
      method: "GET",
      path: "/api/search/",
      query: { q: "javascript integration" }
    },
    {
      method: "GET",
      path: "/api/admin/metrics",
      auth: true
    }
  ];
}

export function endpointName(endpoint) {
  return `${endpoint.method} ${endpoint.path}`;
}
