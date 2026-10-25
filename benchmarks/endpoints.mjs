const multipartBoundary = "----freelanceflow-benchmark";

function jsonBody(payload) {
  return {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  };
}

function multipartBody() {
  return {
    headers: { "Content-Type": `multipart/form-data; boundary=${multipartBoundary}` },
    body: [
      `--${multipartBoundary}`,
      'Content-Disposition: form-data; name="file"; filename="portfolio.txt"',
      "Content-Type: text/plain",
      "",
      "Synthetic benchmark upload fixture for freelancer portfolio review.",
      `--${multipartBoundary}--`,
      ""
    ].join("\r\n")
  };
}

const jobPayload = {
  title: "Frontend marketplace dashboard",
  description: "Build a responsive dashboard for client hiring and freelancer delivery workflows.",
  budgetMin: 500,
  budgetMax: 1500,
  categoryId: "web-development",
  skills: ["react", "node", "api"]
};

export const BENCHMARK_ENDPOINTS = [
  { id: "health", method: "GET", path: "/health" },
  {
    id: "auth.register",
    method: "POST",
    path: "/api/auth/register",
    ...jsonBody({
      email: "benchmark-register@example.com",
      password: "benchmark-password",
      role: "client"
    })
  },
  {
    id: "auth.login",
    method: "POST",
    path: "/api/auth/login",
    ...jsonBody({
      email: "benchmark-login@example.com",
      password: "benchmark-password"
    })
  },
  { id: "auth.oauthCallback", method: "GET", path: "/api/auth/oauth/github/callback" },
  { id: "auth.refresh", method: "POST", path: "/api/auth/refresh" },
  { id: "users.list", method: "GET", path: "/api/users" },
  {
    id: "users.create",
    method: "POST",
    path: "/api/users",
    ...jsonBody({
      email: "benchmark-user@example.com",
      role: "freelancer",
      profile: {
        headline: "Full-stack benchmark profile",
        hourlyRate: 45,
        skills: ["node", "react", "analytics"]
      }
    })
  },
  { id: "jobs.list", method: "GET", path: "/api/jobs" },
  {
    id: "jobs.create",
    method: "POST",
    path: "/api/jobs",
    ...jsonBody(jobPayload)
  },
  { id: "proposals.list", method: "GET", path: "/api/proposals" },
  {
    id: "proposals.create",
    method: "POST",
    path: "/api/proposals",
    ...jsonBody({
      jobId: "job_benchmark",
      freelancerId: "usr_benchmark",
      coverLetter: "I can deliver this benchmarked marketplace workflow with tests and clear documentation.",
      proposedRate: 55,
      estimatedHours: 18
    })
  },
  {
    id: "payments.create",
    method: "POST",
    path: "/api/payments",
    ...jsonBody({
      amount: 12500,
      currency: "usd",
      jobId: "job_benchmark",
      payerId: "usr_client",
      payeeId: "usr_freelancer"
    })
  },
  { id: "reviews.list", method: "GET", path: "/api/reviews" },
  {
    id: "reviews.create",
    method: "POST",
    path: "/api/reviews",
    ...jsonBody({
      contractId: "contract_benchmark",
      reviewerId: "usr_client",
      revieweeId: "usr_freelancer",
      rating: 5,
      comment: "Delivered the scoped API benchmark and report on time."
    })
  },
  { id: "messages.list", method: "GET", path: "/api/messages" },
  {
    id: "messages.create",
    method: "POST",
    path: "/api/messages",
    ...jsonBody({
      conversationId: "conversation_benchmark",
      senderId: "usr_client",
      recipientId: "usr_freelancer",
      body: "Can you share the latest benchmark summary and any endpoint regressions?"
    })
  },
  { id: "notifications.list", method: "GET", path: "/api/notifications" },
  {
    id: "notifications.create",
    method: "POST",
    path: "/api/notifications",
    ...jsonBody({
      userId: "usr_freelancer",
      type: "proposal_update",
      message: "Your benchmark proposal received a new client response."
    })
  },
  {
    id: "uploads.create",
    method: "POST",
    path: "/api/uploads",
    ...multipartBody()
  },
  { id: "search.global", method: "GET", path: "/api/search?q=frontend%20engineer" },
  { id: "admin.metrics", method: "GET", path: "/api/admin/metrics", auth: "admin" }
].map((endpoint) => ({
  headers: {},
  body: undefined,
  ...endpoint
}));
