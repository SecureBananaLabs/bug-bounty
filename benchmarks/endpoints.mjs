const longJobDescription =
  "Build a responsive marketplace dashboard with saved filters, proposal review, milestone tracking, and client messaging. Include accessibility checks and realistic empty states.";

function jsonBody(payload) {
  return {
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  };
}

function uploadBody() {
  const form = new FormData();
  const content = "benchmark upload payload\n".repeat(64);
  form.append("file", new Blob([content], { type: "text/plain" }), "benchmark-notes.txt");
  return { body: form };
}

export const benchmarkEndpoints = [
  {
    name: "health",
    method: "GET",
    path: "/health",
    description: "Service health probe"
  },
  {
    name: "auth_register",
    method: "POST",
    path: "/api/auth/register",
    description: "Register a benchmark client user",
    request: ({ iteration }) =>
      jsonBody({
        email: `benchmark.client.${iteration}@example.com`,
        password: "benchmark-password",
        role: "client"
      })
  },
  {
    name: "auth_login",
    method: "POST",
    path: "/api/auth/login",
    description: "Login with realistic credentials",
    request: () =>
      jsonBody({
        email: "existing.client@example.com",
        password: "benchmark-password"
      })
  },
  {
    name: "auth_oauth_callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback",
    description: "OAuth provider callback stub"
  },
  {
    name: "auth_refresh",
    method: "POST",
    path: "/api/auth/refresh",
    description: "Refresh an access token"
  },
  {
    name: "users_list",
    method: "GET",
    path: "/api/users",
    description: "List users"
  },
  {
    name: "users_create",
    method: "POST",
    path: "/api/users",
    description: "Create a freelancer profile-sized user record",
    request: ({ iteration }) =>
      jsonBody({
        email: `benchmark.freelancer.${iteration}@example.com`,
        name: "Benchmark Freelancer",
        role: "freelancer",
        hourlyRate: 85,
        skills: ["node", "react", "api-performance", "payments"],
        bio: "Senior full-stack freelancer with marketplace and payments experience."
      })
  },
  {
    name: "jobs_list",
    method: "GET",
    path: "/api/jobs",
    description: "List jobs"
  },
  {
    name: "jobs_create",
    method: "POST",
    path: "/api/jobs",
    description: "Create a realistic marketplace job",
    request: ({ iteration }) =>
      jsonBody({
        title: `Benchmark dashboard build ${iteration}`,
        description: longJobDescription,
        budgetMin: 1500,
        budgetMax: 4500,
        categoryId: "web-apps",
        skills: ["node", "react", "postgres", "payments"]
      })
  },
  {
    name: "proposals_list",
    method: "GET",
    path: "/api/proposals",
    description: "List proposals"
  },
  {
    name: "proposals_create",
    method: "POST",
    path: "/api/proposals",
    description: "Create a proposal payload",
    request: ({ iteration }) =>
      jsonBody({
        jobId: `job_benchmark_${iteration}`,
        freelancerId: "usr_benchmark_freelancer",
        coverLetter:
          "I can deliver the API benchmark dashboard in two milestones with automated validation and weekly demos.",
        proposedBudget: 3200,
        estimatedDays: 14
      })
  },
  {
    name: "payments_create",
    method: "POST",
    path: "/api/payments",
    description: "Create a payment intent-sized payload",
    request: ({ iteration }) =>
      jsonBody({
        jobId: `job_benchmark_${iteration}`,
        clientId: "usr_benchmark_client",
        freelancerId: "usr_benchmark_freelancer",
        amount: 3200,
        currency: "usd"
      })
  },
  {
    name: "reviews_list",
    method: "GET",
    path: "/api/reviews",
    description: "List reviews"
  },
  {
    name: "reviews_create",
    method: "POST",
    path: "/api/reviews",
    description: "Create a post-project review",
    request: ({ iteration }) =>
      jsonBody({
        jobId: `job_benchmark_${iteration}`,
        reviewerId: "usr_benchmark_client",
        revieweeId: "usr_benchmark_freelancer",
        rating: 5,
        comment: "Delivered quickly, communicated clearly, and kept the API stable under load."
      })
  },
  {
    name: "messages_list",
    method: "GET",
    path: "/api/messages",
    description: "List messages"
  },
  {
    name: "messages_create",
    method: "POST",
    path: "/api/messages",
    description: "Send a project message",
    request: ({ iteration }) =>
      jsonBody({
        threadId: `thread_benchmark_${iteration % 3}`,
        senderId: "usr_benchmark_client",
        recipientId: "usr_benchmark_freelancer",
        body: "Can you share the latest milestone status and benchmark report before the review call?"
      })
  },
  {
    name: "notifications_list",
    method: "GET",
    path: "/api/notifications",
    description: "List notifications"
  },
  {
    name: "notifications_create",
    method: "POST",
    path: "/api/notifications",
    description: "Create a notification",
    request: ({ iteration }) =>
      jsonBody({
        userId: "usr_benchmark_freelancer",
        type: "proposal_update",
        title: "Proposal shortlisted",
        message: `Benchmark notification ${iteration}: your proposal moved to review.`
      })
  },
  {
    name: "uploads_create",
    method: "POST",
    path: "/api/uploads",
    description: "Upload a representative text attachment",
    request: uploadBody
  },
  {
    name: "search",
    method: "GET",
    path: "/api/search?q=react%20payments%20benchmark",
    description: "Search with realistic keywords"
  },
  {
    name: "admin_metrics",
    method: "GET",
    path: "/api/admin/metrics",
    description: "Protected admin metrics route",
    auth: true
  }
];
