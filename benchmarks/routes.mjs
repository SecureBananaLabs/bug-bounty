export const routes = [
  {
    id: "auth.register",
    method: "POST",
    path: "/api/auth/register",
    json: ({ runId, index }) => ({
      email: `bench-${runId}-${index}@example.com`,
      password: "correct-horse-battery",
      role: index % 2 === 0 ? "client" : "freelancer"
    })
  },
  {
    id: "auth.login",
    method: "POST",
    path: "/api/auth/login",
    json: () => ({
      email: "existing-benchmark-user@example.com",
      password: "correct-horse-battery"
    })
  },
  {
    id: "auth.oauthCallback",
    method: "GET",
    path: "/api/auth/oauth/github/callback?code=benchmark-code"
  },
  {
    id: "auth.refresh",
    method: "POST",
    path: "/api/auth/refresh",
    json: () => ({ refreshToken: "benchmark-refresh-token" })
  },
  { id: "users.list", method: "GET", path: "/api/users" },
  {
    id: "users.create",
    method: "POST",
    path: "/api/users",
    json: ({ runId, index }) => ({
      name: `Benchmark User ${index}`,
      email: `bench-user-${runId}-${index}@example.com`,
      role: "freelancer",
      profile: {
        hourlyRate: 95,
        skills: ["react", "node", "payments"],
        location: "Remote"
      }
    })
  },
  { id: "jobs.list", method: "GET", path: "/api/jobs" },
  {
    id: "jobs.create",
    method: "POST",
    path: "/api/jobs",
    json: ({ index }) => ({
      title: `Build invoice dashboard ${index}`,
      description: "Create a dashboard for invoices, proposals, milestones, and payout status.",
      budgetMin: 2500,
      budgetMax: 6500,
      categoryId: "cat_fullstack",
      skills: ["typescript", "postgres", "stripe", "dashboard"]
    })
  },
  { id: "proposals.list", method: "GET", path: "/api/proposals" },
  {
    id: "proposals.create",
    method: "POST",
    path: "/api/proposals",
    json: ({ index }) => ({
      jobId: `job_benchmark_${index}`,
      freelancerId: "usr_benchmark_freelancer",
      coverLetter: "I can deliver this in two milestone-backed iterations with weekly demos.",
      bidAmount: 4200,
      timelineDays: 14
    })
  },
  {
    id: "payments.create",
    method: "POST",
    path: "/api/payments",
    json: () => ({
      amount: 125000,
      currency: "usd",
      metadata: {
        jobId: "job_benchmark",
        milestoneId: "milestone_design"
      }
    })
  },
  { id: "reviews.list", method: "GET", path: "/api/reviews" },
  {
    id: "reviews.create",
    method: "POST",
    path: "/api/reviews",
    json: () => ({
      jobId: "job_benchmark",
      reviewerId: "usr_benchmark_client",
      revieweeId: "usr_benchmark_freelancer",
      rating: 5,
      body: "Clear scope, frequent updates, and clean delivery."
    })
  },
  { id: "messages.list", method: "GET", path: "/api/messages" },
  {
    id: "messages.create",
    method: "POST",
    path: "/api/messages",
    json: () => ({
      conversationId: "cnv_benchmark",
      senderId: "usr_benchmark_client",
      body: "Can you attach the latest milestone notes before review?"
    })
  },
  { id: "notifications.list", method: "GET", path: "/api/notifications" },
  {
    id: "notifications.create",
    method: "POST",
    path: "/api/notifications",
    json: () => ({
      userId: "usr_benchmark_freelancer",
      type: "milestone_review",
      message: "A milestone is ready for review."
    })
  },
  {
    id: "uploads.create",
    method: "POST",
    path: "/api/uploads",
    multipart: {
      field: "file",
      filename: "benchmark-brief.txt",
      contentType: "text/plain",
      body: "Benchmark upload fixture for milestone scope and delivery notes.\n"
    }
  },
  {
    id: "search.global",
    method: "GET",
    path: "/api/search?q=react%20payments%20dashboard"
  },
  {
    id: "admin.metrics",
    method: "GET",
    path: "/api/admin/metrics",
    auth: true
  }
];
