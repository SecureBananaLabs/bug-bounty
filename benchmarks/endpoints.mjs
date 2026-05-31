export function makeEndpointDefinitions({ authToken }) {
  const authHeaders = authToken ? { authorization: `Bearer ${authToken}` } : {};

  return [
    {
      name: "health",
      method: "GET",
      path: "/health",
      description: "Service health check"
    },
    {
      name: "auth-register",
      method: "POST",
      path: "/api/auth/register",
      description: "Client account registration",
      json: (sequence) => ({
        email: `benchmark+${Date.now()}-${sequence}@example.com`,
        password: "benchmark-pass-123",
        role: "client"
      })
    },
    {
      name: "auth-login",
      method: "POST",
      path: "/api/auth/login",
      description: "Client login",
      json: (sequence) => ({
        email: `benchmark-login-${sequence}@example.com`,
        password: "benchmark-pass-123"
      })
    },
    {
      name: "auth-oauth-callback",
      method: "GET",
      path: "/api/auth/oauth/github/callback",
      description: "OAuth provider callback"
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
      description: "List users"
    },
    {
      name: "users-create",
      method: "POST",
      path: "/api/users",
      description: "Create user profile",
      json: (sequence) => ({
        email: `benchmark-user-${sequence}@example.com`,
        name: "Benchmark User",
        role: "freelancer",
        skills: ["node", "api", "benchmark"]
      })
    },
    {
      name: "jobs-list",
      method: "GET",
      path: "/api/jobs",
      description: "List jobs"
    },
    {
      name: "jobs-create",
      method: "POST",
      path: "/api/jobs",
      description: "Post a realistic job",
      json: () => ({
        title: "Build a benchmark dashboard",
        description: "Create a lightweight dashboard that summarizes API performance trends.",
        budgetMin: 500,
        budgetMax: 1500,
        categoryId: "engineering",
        skills: ["node", "express", "performance"]
      })
    },
    {
      name: "proposals-list",
      method: "GET",
      path: "/api/proposals",
      description: "List proposals"
    },
    {
      name: "proposals-create",
      method: "POST",
      path: "/api/proposals",
      description: "Create proposal",
      json: () => ({
        jobId: "job_benchmark",
        freelancerId: "usr_benchmark",
        coverLetter: "I can deliver a focused performance dashboard with reproducible metrics.",
        bidAmount: 900,
        estimatedDays: 5
      })
    },
    {
      name: "payments-create",
      method: "POST",
      path: "/api/payments",
      description: "Create payment intent",
      json: () => ({
        amount: 12500,
        currency: "usd",
        jobId: "job_benchmark"
      })
    },
    {
      name: "reviews-list",
      method: "GET",
      path: "/api/reviews",
      description: "List reviews"
    },
    {
      name: "reviews-create",
      method: "POST",
      path: "/api/reviews",
      description: "Create review",
      json: () => ({
        jobId: "job_benchmark",
        reviewerId: "usr_client",
        revieweeId: "usr_freelancer",
        rating: 5,
        comment: "Clear delivery, measurable output, and repeatable validation."
      })
    },
    {
      name: "messages-list",
      method: "GET",
      path: "/api/messages",
      description: "List messages"
    },
    {
      name: "messages-create",
      method: "POST",
      path: "/api/messages",
      description: "Send message",
      json: () => ({
        threadId: "thread_benchmark",
        senderId: "usr_client",
        recipientId: "usr_freelancer",
        body: "Please confirm the benchmark report and threshold gate."
      })
    },
    {
      name: "notifications-list",
      method: "GET",
      path: "/api/notifications",
      description: "List notifications"
    },
    {
      name: "notifications-create",
      method: "POST",
      path: "/api/notifications",
      description: "Create notification",
      json: () => ({
        userId: "usr_client",
        type: "benchmark.report.ready",
        message: "Your benchmark report is ready for review."
      })
    },
    {
      name: "uploads-create",
      method: "POST",
      path: "/api/uploads",
      description: "Upload representative text attachment",
      formData: (sequence) => {
        const form = new FormData();
        const content = `benchmark attachment ${sequence}\nroute coverage proof\n`;
        form.set("file", new Blob([content], { type: "text/plain" }), `benchmark-${sequence}.txt`);
        return form;
      }
    },
    {
      name: "search",
      method: "GET",
      path: "/api/search?q=performance%20engineer",
      description: "Global search"
    },
    {
      name: "admin-metrics",
      method: "GET",
      path: "/api/admin/metrics",
      description: "Protected admin metrics",
      headers: authHeaders
    }
  ];
}
