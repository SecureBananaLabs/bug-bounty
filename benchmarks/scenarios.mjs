export const scenarios = [
  {
    name: "health",
    method: "GET",
    path: "/health",
    expectedStatuses: [200]
  },
  {
    name: "auth-register",
    method: "POST",
    path: "/api/auth/register",
    expectedStatuses: [201],
    json: ({ runId, iteration }) => ({
      email: `benchmark-${runId}-${iteration}@example.com`,
      password: "correct-horse-battery-staple",
      role: "client"
    })
  },
  {
    name: "auth-login",
    method: "POST",
    path: "/api/auth/login",
    expectedStatuses: [200],
    json: ({ runId, iteration }) => ({
      email: `login-${runId}-${iteration}@example.com`,
      password: "correct-horse-battery-staple"
    })
  },
  {
    name: "auth-refresh",
    method: "POST",
    path: "/api/auth/refresh",
    expectedStatuses: [200],
    json: () => ({})
  },
  {
    name: "auth-oauth-callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback",
    expectedStatuses: [200]
  },
  {
    name: "users-list",
    method: "GET",
    path: "/api/users",
    expectedStatuses: [200]
  },
  {
    name: "users-create",
    method: "POST",
    path: "/api/users",
    expectedStatuses: [201],
    json: ({ runId, iteration }) => ({
      email: `user-${runId}-${iteration}@example.com`,
      name: "Benchmark User",
      role: "freelancer",
      skills: ["api-testing", "qa"]
    })
  },
  {
    name: "jobs-list",
    method: "GET",
    path: "/api/jobs",
    expectedStatuses: [200]
  },
  {
    name: "jobs-create",
    method: "POST",
    path: "/api/jobs",
    expectedStatuses: [201],
    json: ({ iteration }) => ({
      title: `Benchmark QA cycle ${iteration}`,
      description: "Synthetic job payload used to benchmark job creation.",
      budgetMin: 500,
      budgetMax: 1200,
      categoryId: "cat_quality_assurance",
      skills: ["testing", "automation", "api"]
    })
  },
  {
    name: "proposals-list",
    method: "GET",
    path: "/api/proposals",
    expectedStatuses: [200]
  },
  {
    name: "proposals-create",
    method: "POST",
    path: "/api/proposals",
    expectedStatuses: [201],
    json: ({ runId, iteration }) => ({
      jobId: `job_${runId}`,
      freelancerId: `usr_${iteration}`,
      coverLetter: "I can validate the API and deliver a concise benchmark report.",
      amount: 750
    })
  },
  {
    name: "payments-create",
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
    name: "reviews-list",
    method: "GET",
    path: "/api/reviews",
    expectedStatuses: [200]
  },
  {
    name: "reviews-create",
    method: "POST",
    path: "/api/reviews",
    expectedStatuses: [201],
    json: () => ({
      jobId: "job_benchmark",
      rating: 5,
      comment: "Clear delivery and fast communication."
    })
  },
  {
    name: "messages-list",
    method: "GET",
    path: "/api/messages",
    expectedStatuses: [200]
  },
  {
    name: "messages-create",
    method: "POST",
    path: "/api/messages",
    expectedStatuses: [201],
    json: ({ iteration }) => ({
      threadId: "thread_benchmark",
      senderId: `usr_${iteration}`,
      body: "Benchmark message payload for marketplace conversations."
    })
  },
  {
    name: "notifications-list",
    method: "GET",
    path: "/api/notifications",
    expectedStatuses: [200]
  },
  {
    name: "notifications-create",
    method: "POST",
    path: "/api/notifications",
    expectedStatuses: [201],
    json: () => ({
      userId: "usr_benchmark",
      type: "proposal_received",
      message: "A freelancer submitted a proposal."
    })
  },
  {
    name: "uploads-create",
    method: "POST",
    path: "/api/uploads",
    expectedStatuses: [201],
    formData: () => {
      const body = new FormData();
      body.set(
        "file",
        new Blob(["benchmark upload payload"], { type: "text/plain" }),
        "benchmark.txt"
      );
      return body;
    }
  },
  {
    name: "search",
    method: "GET",
    path: "/api/search?q=typescript%20qa",
    expectedStatuses: [200]
  },
  {
    name: "admin-metrics",
    method: "GET",
    path: "/api/admin/metrics",
    auth: true,
    expectedStatuses: [200]
  }
];
