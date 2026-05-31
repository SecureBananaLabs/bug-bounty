const jsonHeaders = { "content-type": "application/json" };

function json(payload) {
  return {
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  };
}

function multipartUpload() {
  const boundary = "----freelanceflow-benchmark";
  const body = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="file"; filename="portfolio-sample.txt"',
    "Content-Type: text/plain",
    "",
    "Benchmark portfolio sample with realistic small upload content.",
    `--${boundary}--`,
    ""
  ].join("\r\n");

  return {
    headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
    body
  };
}

export function buildBenchmarkRoutes(authToken) {
  const authHeaders = authToken ? { authorization: `Bearer ${authToken}` } : {};
  const stamp = Date.now();

  return [
    {
      name: "auth.register",
      method: "POST",
      path: "/api/auth/register",
      ...json({
        email: `benchmark-client-${stamp}@example.com`,
        password: "benchmark-password",
        role: "client"
      })
    },
    {
      name: "auth.login",
      method: "POST",
      path: "/api/auth/login",
      ...json({
        email: "existing-client@example.com",
        password: "benchmark-password"
      })
    },
    {
      name: "auth.oauthCallback",
      method: "GET",
      path: "/api/auth/oauth/google/callback"
    },
    {
      name: "auth.refresh",
      method: "POST",
      path: "/api/auth/refresh",
      ...json({})
    },
    {
      name: "users.list",
      method: "GET",
      path: "/api/users"
    },
    {
      name: "users.create",
      method: "POST",
      path: "/api/users",
      ...json({
        email: `benchmark-freelancer-${stamp}@example.com`,
        displayName: "Benchmark Freelancer",
        role: "freelancer",
        skills: ["node", "react", "api-design"],
        hourlyRate: 85,
        bio: "Senior full-stack freelancer profile used by API benchmark payloads."
      })
    },
    {
      name: "jobs.list",
      method: "GET",
      path: "/api/jobs"
    },
    {
      name: "jobs.create",
      method: "POST",
      path: "/api/jobs",
      ...json({
        title: "Build marketplace dashboard",
        description: "Create a production-ready dashboard with job, proposal, and billing views.",
        budgetMin: 2500,
        budgetMax: 6500,
        categoryId: "cat_web_app",
        skills: ["typescript", "nextjs", "express", "postgres"]
      })
    },
    {
      name: "proposals.list",
      method: "GET",
      path: "/api/proposals"
    },
    {
      name: "proposals.create",
      method: "POST",
      path: "/api/proposals",
      ...json({
        jobId: "job_benchmark",
        freelancerId: "usr_benchmark_freelancer",
        coverLetter: "I can deliver the dashboard with milestone-based reviews and clear handoff docs.",
        amount: 4200,
        estimatedDays: 14
      })
    },
    {
      name: "payments.create",
      method: "POST",
      path: "/api/payments",
      ...json({
        jobId: "job_benchmark",
        payerId: "usr_benchmark_client",
        payeeId: "usr_benchmark_freelancer",
        amount: 4200,
        currency: "usd"
      })
    },
    {
      name: "reviews.list",
      method: "GET",
      path: "/api/reviews"
    },
    {
      name: "reviews.create",
      method: "POST",
      path: "/api/reviews",
      ...json({
        jobId: "job_benchmark",
        reviewerId: "usr_benchmark_client",
        revieweeId: "usr_benchmark_freelancer",
        rating: 5,
        comment: "Delivered the milestone cleanly with clear communication."
      })
    },
    {
      name: "messages.list",
      method: "GET",
      path: "/api/messages"
    },
    {
      name: "messages.create",
      method: "POST",
      path: "/api/messages",
      ...json({
        threadId: "thread_benchmark",
        senderId: "usr_benchmark_client",
        recipientId: "usr_benchmark_freelancer",
        body: "Can you confirm the dashboard acceptance criteria before milestone two?"
      })
    },
    {
      name: "notifications.list",
      method: "GET",
      path: "/api/notifications"
    },
    {
      name: "notifications.create",
      method: "POST",
      path: "/api/notifications",
      ...json({
        userId: "usr_benchmark_freelancer",
        type: "proposal_viewed",
        message: "A client viewed your proposal for the marketplace dashboard."
      })
    },
    {
      name: "uploads.create",
      method: "POST",
      path: "/api/uploads",
      ...multipartUpload()
    },
    {
      name: "search.query",
      method: "GET",
      path: "/api/search?q=marketplace%20dashboard"
    },
    {
      name: "admin.metrics",
      method: "GET",
      path: "/api/admin/metrics",
      headers: authHeaders
    }
  ];
}
