function benchmarkEmail(prefix, sequence) {
  return `${prefix}-${sequence}@example.com`;
}

function jobDescription(sequence) {
  return [
    `Benchmark marketplace integration project ${sequence}.`,
    "The client needs a freelancer to audit a production API workflow, document latency-sensitive endpoints, add regression coverage, and prepare a rollout checklist.",
    "The expected deliverables include a short implementation plan, endpoint-by-endpoint notes, screenshots or logs from validation, and a final handoff summary for the product team.",
    "This payload is intentionally longer than a placeholder so the benchmark exercises realistic JSON parsing and response serialization sizes."
  ].join(" ");
}

function proposalCoverLetter(sequence) {
  return [
    `Hello, I can help with benchmark project ${sequence}.`,
    "I will start by confirming the target endpoints, then reproduce the current behavior locally, measure latency and error rates, and document any risk before making changes.",
    "After implementation, I will provide clear test results, benchmark output, and a concise handoff note so the client can review the work quickly.",
    "My bid includes communication time, validation, and one focused revision pass if the acceptance criteria need small adjustments."
  ].join(" ");
}

function messageBody(sequence) {
  return [
    `Benchmark message ${sequence}:`,
    "The latest API run is complete. Please review the attached summary, especially the endpoints with the highest p95 latency and any route that returned unexpected status codes.",
    "I can prepare a shorter client-facing update once the benchmark numbers are approved."
  ].join(" ");
}

function uploadPayload() {
  return [
    "benchmark upload payload",
    "This file represents a small client attachment with notes, acceptance criteria, and validation details.",
    "It is sized beyond a trivial token so upload handling, multipart parsing, and response generation are all exercised.",
    "Repeatable benchmark content follows.",
    "latency,p95,p99,error_rate,status_codes",
    "jobs,1.35,2.77,0,201",
    "messages,1.26,2.98,0,201"
  ].join("\n");
}

export const endpoints = [
  {
    name: "health",
    method: "GET",
    path: "/health"
  },
  {
    name: "auth-register",
    method: "POST",
    path: "/api/auth/register",
    body: ({ sequence }) => ({
      email: benchmarkEmail("benchmark-register", sequence),
      password: "benchmark-password",
      role: "client"
    })
  },
  {
    name: "auth-login",
    method: "POST",
    path: "/api/auth/login",
    body: () => ({
      email: "benchmark@example.com",
      password: "benchmark-password"
    })
  },
  {
    name: "auth-oauth-callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback"
  },
  {
    name: "auth-refresh",
    method: "POST",
    path: "/api/auth/refresh"
  },
  {
    name: "users-list",
    method: "GET",
    path: "/api/users"
  },
  {
    name: "users-create",
    method: "POST",
    path: "/api/users",
    body: ({ sequence }) => ({
      email: benchmarkEmail("benchmark-user", sequence),
      fullName: `Benchmark Client ${sequence}`,
      bio: "Client profile used to exercise API response serialization for marketplace account data.",
      role: "client",
      skills: ["api review", "documentation", "qa"]
    })
  },
  {
    name: "jobs-list",
    method: "GET",
    path: "/api/jobs"
  },
  {
    name: "jobs-create",
    method: "POST",
    path: "/api/jobs",
    body: ({ sequence }) => ({
      title: `API performance audit and rollout support ${sequence}`,
      description: jobDescription(sequence),
      budgetMin: 750,
      budgetMax: 2400,
      categoryId: "software-development",
      clientId: `benchmark-client-${sequence}`,
      skills: ["api performance", "node.js", "benchmarking", "technical writing"]
    })
  },
  {
    name: "proposals-list",
    method: "GET",
    path: "/api/proposals"
  },
  {
    name: "proposals-create",
    method: "POST",
    path: "/api/proposals",
    body: ({ sequence }) => ({
      jobId: `benchmark-job-${sequence}`,
      freelancerId: `benchmark-freelancer-${sequence}`,
      coverLetter: proposalCoverLetter(sequence),
      bidAmount: 1250,
      estDuration: "3 business days"
    })
  },
  {
    name: "payments-create",
    method: "POST",
    path: "/api/payments",
    body: ({ sequence }) => ({
      amount: 125000,
      currency: "usd",
      jobId: `benchmark-job-${sequence}`,
      proposalId: `benchmark-proposal-${sequence}`
    })
  },
  {
    name: "reviews-list",
    method: "GET",
    path: "/api/reviews"
  },
  {
    name: "reviews-create",
    method: "POST",
    path: "/api/reviews",
    body: ({ sequence }) => ({
      reviewerId: `benchmark-client-${sequence}`,
      revieweeId: `benchmark-freelancer-${sequence}`,
      targetId: `benchmark-target-${sequence}`,
      rating: 5,
      comment: "Delivered the API benchmark update on time, explained tradeoffs clearly, and provided reproducible results for the product and engineering teams."
    })
  },
  {
    name: "messages-list",
    method: "GET",
    path: "/api/messages"
  },
  {
    name: "messages-create",
    method: "POST",
    path: "/api/messages",
    body: ({ sequence }) => ({
      threadId: `benchmark-thread-${sequence}`,
      senderId: `benchmark-client-${sequence}`,
      receiverId: `benchmark-freelancer-${sequence}`,
      body: messageBody(sequence)
    })
  },
  {
    name: "notifications-list",
    method: "GET",
    path: "/api/notifications"
  },
  {
    name: "notifications-create",
    method: "POST",
    path: "/api/notifications",
    body: ({ sequence }) => ({
      userId: `benchmark-user-${sequence}`,
      type: "proposal_status",
      title: "Proposal benchmark update",
      message: `Proposal benchmark ${sequence} moved to client review after the API performance report was generated.`
    })
  },
  {
    name: "uploads-create",
    method: "POST",
    path: "/api/uploads",
    formData: () => {
      const form = new FormData();
      form.set("file", new Blob([uploadPayload()], { type: "text/plain" }), "benchmark-report.txt");
      return form;
    }
  },
  {
    name: "search",
    method: "GET",
    path: "/api/search?q=benchmark"
  },
  {
    name: "admin-metrics",
    method: "GET",
    path: "/api/admin/metrics",
    auth: true
  }
];
