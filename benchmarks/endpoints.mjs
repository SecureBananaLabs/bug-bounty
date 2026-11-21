export const realisticPayloads = {
  user: {
    email: "benchmark.freelancer@example.com",
    name: "Benchmark Freelancer",
    role: "freelancer",
    title: "Senior full-stack engineer",
    hourlyRate: 85,
    skills: ["nodejs", "react", "postgresql", "api-performance"],
    bio: "Builds production-grade freelance marketplace APIs and performance tooling."
  },
  job: {
    title: "Build a secure freelancer dashboard",
    description:
      "Create an authenticated dashboard with proposal tracking, payment status, and notification settings for a production freelance marketplace.",
    budgetMin: 2500,
    budgetMax: 7500,
    categoryId: "web-development",
    skills: ["nextjs", "nodejs", "security", "payments"]
  },
  proposal: {
    jobId: "job_benchmark",
    freelancerId: "usr_benchmark_freelancer",
    coverLetter:
      "I can deliver the dashboard in three milestones with API contract tests, observability hooks, and a staged rollout plan.",
    amount: 6200,
    timelineDays: 21
  },
  payment: {
    contractId: "ctr_benchmark",
    clientId: "usr_benchmark_client",
    freelancerId: "usr_benchmark_freelancer",
    amount: 6200,
    currency: "usd",
    milestone: "dashboard-delivery"
  },
  review: {
    contractId: "ctr_benchmark",
    reviewerId: "usr_benchmark_client",
    revieweeId: "usr_benchmark_freelancer",
    rating: 5,
    comment: "Delivered the API work on time with clear communication and strong test coverage."
  },
  message: {
    conversationId: "cnv_benchmark",
    senderId: "usr_benchmark_client",
    recipientId: "usr_benchmark_freelancer",
    body: "Can you share the latest dashboard preview and benchmark report before the milestone review?"
  },
  notification: {
    userId: "usr_benchmark_freelancer",
    type: "proposal_update",
    title: "Proposal accepted",
    body: "Your proposal for the secure freelancer dashboard has been accepted."
  }
};

export const endpoints = [
  {
    name: "auth.register",
    method: "POST",
    path: "/api/auth/register",
    body: {
      email: "benchmark.register@example.com",
      password: "benchmark-password",
      role: "freelancer"
    }
  },
  {
    name: "auth.login",
    method: "POST",
    path: "/api/auth/login",
    body: {
      email: "benchmark.login@example.com",
      password: "benchmark-password"
    }
  },
  { name: "auth.oauth.callback", method: "GET", path: "/api/auth/oauth/github/callback" },
  { name: "auth.refresh", method: "POST", path: "/api/auth/refresh" },
  { name: "users.list", method: "GET", path: "/api/users" },
  { name: "users.create", method: "POST", path: "/api/users", body: realisticPayloads.user },
  { name: "jobs.list", method: "GET", path: "/api/jobs" },
  { name: "jobs.create", method: "POST", path: "/api/jobs", body: realisticPayloads.job },
  { name: "proposals.list", method: "GET", path: "/api/proposals" },
  { name: "proposals.create", method: "POST", path: "/api/proposals", body: realisticPayloads.proposal },
  { name: "payments.create", method: "POST", path: "/api/payments", body: realisticPayloads.payment },
  { name: "reviews.list", method: "GET", path: "/api/reviews" },
  { name: "reviews.create", method: "POST", path: "/api/reviews", body: realisticPayloads.review },
  { name: "messages.list", method: "GET", path: "/api/messages" },
  { name: "messages.create", method: "POST", path: "/api/messages", body: realisticPayloads.message },
  { name: "notifications.list", method: "GET", path: "/api/notifications" },
  { name: "notifications.create", method: "POST", path: "/api/notifications", body: realisticPayloads.notification },
  {
    name: "uploads.create",
    method: "POST",
    path: "/api/uploads",
    multipart: {
      field: "file",
      filename: "benchmark-portfolio.txt",
      contentType: "text/plain",
      value: "Portfolio sample for benchmark upload route.\n".repeat(24)
    }
  },
  { name: "search.global", method: "GET", path: "/api/search?q=senior%20node%20freelancer" },
  { name: "admin.metrics", method: "GET", path: "/api/admin/metrics", auth: true }
];
