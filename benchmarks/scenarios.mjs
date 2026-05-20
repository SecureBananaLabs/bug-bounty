const runId = `bench-${Date.now().toString(36)}`;

const userAgent = "freelanceflow-api-benchmark/1.0";

function baseHeaders(iteration) {
  return {
    "user-agent": userAgent,
    "x-benchmark-run": runId,
    "x-benchmark-iteration": String(iteration)
  };
}

function jsonRequest(method, path, payload) {
  return ({ iteration }) => ({
    method,
    path,
    headers: {
      ...baseHeaders(iteration),
      "content-type": "application/json"
    },
    body: JSON.stringify(payload(iteration))
  });
}

function getRequest(path) {
  return ({ iteration }) => ({
    method: "GET",
    path,
    headers: baseHeaders(iteration)
  });
}

function authGetRequest(path) {
  return ({ iteration, authToken }) => ({
    method: "GET",
    path,
    headers: {
      ...baseHeaders(iteration),
      authorization: `Bearer ${authToken}`
    }
  });
}

const description = [
  "Build a production-ready dashboard that helps clients compare freelancer proposals,",
  "track milestone risk, and export weekly delivery summaries for finance review."
].join(" ");

export const scenarios = [
  {
    id: "auth-register",
    name: "Register user",
    method: "POST",
    path: "/api/auth/register",
    expectedStatuses: [201],
    buildRequest: jsonRequest("POST", "/api/auth/register", (iteration) => ({
      email: `${runId}+client-${iteration}@example.test`,
      password: "BenchmarkPass123!",
      role: iteration % 3 === 0 ? "freelancer" : "client"
    }))
  },
  {
    id: "auth-login",
    name: "Login user",
    method: "POST",
    path: "/api/auth/login",
    expectedStatuses: [200],
    buildRequest: jsonRequest("POST", "/api/auth/login", (iteration) => ({
      email: `${runId}+login-${iteration}@example.test`,
      password: "BenchmarkPass123!"
    }))
  },
  {
    id: "auth-refresh",
    name: "Refresh token",
    method: "POST",
    path: "/api/auth/refresh",
    expectedStatuses: [200],
    buildRequest: jsonRequest("POST", "/api/auth/refresh", () => ({}))
  },
  {
    id: "auth-oauth-callback",
    name: "OAuth callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback",
    expectedStatuses: [200],
    buildRequest: getRequest("/api/auth/oauth/github/callback")
  },
  {
    id: "users-list",
    name: "List users",
    method: "GET",
    path: "/api/users",
    expectedStatuses: [200],
    buildRequest: getRequest("/api/users")
  },
  {
    id: "users-create",
    name: "Create user",
    method: "POST",
    path: "/api/users",
    expectedStatuses: [201],
    buildRequest: jsonRequest("POST", "/api/users", (iteration) => ({
      email: `${runId}+profile-${iteration}@example.test`,
      name: `Benchmark Client ${iteration}`,
      role: "client",
      company: "Northstar Studio",
      timezone: "UTC"
    }))
  },
  {
    id: "jobs-list",
    name: "List jobs",
    method: "GET",
    path: "/api/jobs",
    expectedStatuses: [200],
    buildRequest: getRequest("/api/jobs")
  },
  {
    id: "jobs-create",
    name: "Create job",
    method: "POST",
    path: "/api/jobs",
    expectedStatuses: [201],
    buildRequest: jsonRequest("POST", "/api/jobs", (iteration) => ({
      title: `Benchmark marketplace workflow ${iteration}`,
      description,
      budgetMin: 1200,
      budgetMax: 4800,
      categoryId: "cat-product-engineering",
      skills: ["node", "nextjs", "api-design", "payments", "testing"]
    }))
  },
  {
    id: "proposals-list",
    name: "List proposals",
    method: "GET",
    path: "/api/proposals",
    expectedStatuses: [200],
    buildRequest: getRequest("/api/proposals")
  },
  {
    id: "proposals-create",
    name: "Create proposal",
    method: "POST",
    path: "/api/proposals",
    expectedStatuses: [201],
    buildRequest: jsonRequest("POST", "/api/proposals", (iteration) => ({
      jobId: `job-benchmark-${iteration % 5}`,
      freelancerId: `usr-freelancer-${iteration % 7}`,
      coverLetter: `${description} Delivery plan includes discovery, implementation, QA, and release notes.`,
      bidAmount: 2400 + iteration,
      estimatedDays: 10
    }))
  },
  {
    id: "payments-create",
    name: "Create payment intent",
    method: "POST",
    path: "/api/payments",
    expectedStatuses: [201],
    buildRequest: jsonRequest("POST", "/api/payments", (iteration) => ({
      amount: 250000 + iteration,
      currency: "usd",
      jobId: `job-benchmark-${iteration % 5}`,
      milestoneId: `milestone-${iteration % 3}`
    }))
  },
  {
    id: "reviews-list",
    name: "List reviews",
    method: "GET",
    path: "/api/reviews",
    expectedStatuses: [200],
    buildRequest: getRequest("/api/reviews")
  },
  {
    id: "reviews-create",
    name: "Create review",
    method: "POST",
    path: "/api/reviews",
    expectedStatuses: [201],
    buildRequest: jsonRequest("POST", "/api/reviews", (iteration) => ({
      reviewerId: `usr-client-${iteration % 4}`,
      revieweeId: `usr-freelancer-${iteration % 6}`,
      jobId: `job-benchmark-${iteration % 5}`,
      rating: 5,
      comment: "Clear communication, clean implementation, and predictable delivery cadence."
    }))
  },
  {
    id: "messages-list",
    name: "List messages",
    method: "GET",
    path: "/api/messages",
    expectedStatuses: [200],
    buildRequest: getRequest("/api/messages")
  },
  {
    id: "messages-create",
    name: "Create message",
    method: "POST",
    path: "/api/messages",
    expectedStatuses: [201],
    buildRequest: jsonRequest("POST", "/api/messages", (iteration) => ({
      conversationId: `conversation-${iteration % 8}`,
      senderId: `usr-client-${iteration % 4}`,
      recipientId: `usr-freelancer-${iteration % 6}`,
      body: "Can you confirm the milestone acceptance checklist and expected handoff time today?"
    }))
  },
  {
    id: "notifications-list",
    name: "List notifications",
    method: "GET",
    path: "/api/notifications",
    expectedStatuses: [200],
    buildRequest: getRequest("/api/notifications")
  },
  {
    id: "notifications-create",
    name: "Create notification",
    method: "POST",
    path: "/api/notifications",
    expectedStatuses: [201],
    buildRequest: jsonRequest("POST", "/api/notifications", (iteration) => ({
      userId: `usr-client-${iteration % 4}`,
      type: "milestone.updated",
      title: "Milestone ready for review",
      body: "The freelancer submitted the latest milestone package with tests and release notes."
    }))
  },
  {
    id: "uploads-create",
    name: "Upload file",
    method: "POST",
    path: "/api/uploads",
    expectedStatuses: [201],
    buildRequest: ({ iteration }) => {
      const form = new FormData();
      const payload = JSON.stringify({
        runId,
        iteration,
        filename: `deliverable-${iteration}.json`,
        records: Array.from({ length: 24 }, (_, index) => ({
          id: `row-${iteration}-${index}`,
          status: index % 2 === 0 ? "accepted" : "pending",
          amountCents: 12500 + index
        }))
      });
      form.append("file", new Blob([payload], { type: "application/json" }), `benchmark-upload-${iteration}.json`);
      return {
        method: "POST",
        path: "/api/uploads",
        headers: baseHeaders(iteration),
        body: form
      };
    }
  },
  {
    id: "search-query",
    name: "Search",
    method: "GET",
    path: "/api/search?q=node%20payments%20freelancer",
    expectedStatuses: [200],
    buildRequest: getRequest("/api/search?q=node%20payments%20freelancer")
  },
  {
    id: "admin-metrics",
    name: "Admin metrics",
    method: "GET",
    path: "/api/admin/metrics",
    expectedStatuses: [200],
    requiresAuth: true,
    buildRequest: authGetRequest("/api/admin/metrics")
  }
];
