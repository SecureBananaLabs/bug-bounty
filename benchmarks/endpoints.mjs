const jsonHeaders = {
  "content-type": "application/json"
};

function jsonBody(payload) {
  return JSON.stringify(payload);
}

function uploadFixture(runId) {
  const boundary = `----freelanceflow-benchmark-${runId}`;
  const body = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="file"; filename="benchmark-proposal.txt"',
    "Content-Type: text/plain",
    "",
    "Benchmark attachment fixture for proposal review and API upload timing.",
    `--${boundary}--`,
    ""
  ].join("\r\n");

  return {
    body,
    headers: {
      "content-type": `multipart/form-data; boundary=${boundary}`
    }
  };
}

export function buildBenchmarkEndpoints({ authToken, runId = Date.now() } = {}) {
  const authHeaders = authToken ? { authorization: `Bearer ${authToken}` } : {};
  const upload = uploadFixture(runId);

  return [
    {
      name: "Register client",
      method: "POST",
      path: "/api/auth/register",
      headers: jsonHeaders,
      body: jsonBody({
        email: `benchmark.client.${runId}@example.com`,
        password: "BenchmarkPass123!",
        role: "client"
      }),
      description: "Client account creation payload based on auth validators."
    },
    {
      name: "Login client",
      method: "POST",
      path: "/api/auth/login",
      headers: jsonHeaders,
      body: jsonBody({
        email: "benchmark.client@example.com",
        password: "BenchmarkPass123!"
      }),
      description: "Password login payload matching the auth schema."
    },
    {
      name: "OAuth callback",
      method: "GET",
      path: "/api/auth/oauth/github/callback",
      description: "Provider callback route with a representative provider path."
    },
    {
      name: "Refresh token",
      method: "POST",
      path: "/api/auth/refresh",
      headers: jsonHeaders,
      body: jsonBody({ refreshToken: "benchmark-refresh-token" }),
      description: "Refresh route with a realistic token-sized body."
    },
    {
      name: "List users",
      method: "GET",
      path: "/api/users",
      description: "User listing endpoint."
    },
    {
      name: "Create user",
      method: "POST",
      path: "/api/users",
      headers: jsonHeaders,
      body: jsonBody({
        email: `benchmark.freelancer.${runId}@example.com`,
        displayName: "Benchmark Freelancer",
        role: "freelancer",
        skills: ["node.js", "react", "payments", "performance"],
        hourlyRate: 85,
        availability: "part-time"
      }),
      description: "Freelancer profile payload with representative profile fields."
    },
    {
      name: "List jobs",
      method: "GET",
      path: "/api/jobs",
      description: "Job listing endpoint."
    },
    {
      name: "Create job",
      method: "POST",
      path: "/api/jobs",
      headers: jsonHeaders,
      body: jsonBody({
        title: "Build a secure marketplace payment workflow",
        description:
          "Implement milestone escrow, payment confirmation, audit logging, and regression tests for a freelance marketplace workflow.",
        budgetMin: 2500,
        budgetMax: 7500,
        categoryId: "software-development",
        skills: ["node.js", "stripe", "security", "api-design"]
      }),
      description: "Job creation payload based on the production job validator."
    },
    {
      name: "List proposals",
      method: "GET",
      path: "/api/proposals",
      description: "Proposal listing endpoint."
    },
    {
      name: "Create proposal",
      method: "POST",
      path: "/api/proposals",
      headers: jsonHeaders,
      body: jsonBody({
        jobId: "job_benchmark",
        freelancerId: "usr_benchmark_freelancer",
        coverLetter:
          "I have shipped marketplace payment integrations and can deliver the escrow workflow with tests, observability, and deployment notes.",
        proposedRate: 95,
        estimatedHours: 80,
        milestones: [
          { title: "Discovery and API contract", amount: 1500 },
          { title: "Implementation and tests", amount: 4500 },
          { title: "Hardening and handoff", amount: 1500 }
        ]
      }),
      description: "Proposal payload with milestones and cover-letter size close to real submissions."
    },
    {
      name: "Create payment",
      method: "POST",
      path: "/api/payments",
      headers: jsonHeaders,
      body: jsonBody({
        amount: 750000,
        currency: "usd",
        jobId: "job_benchmark",
        milestoneId: "milestone_implementation",
        payerId: "usr_client",
        payeeId: "usr_freelancer"
      }),
      description: "Payment payload using cents and marketplace identifiers."
    },
    {
      name: "List reviews",
      method: "GET",
      path: "/api/reviews",
      description: "Review listing endpoint."
    },
    {
      name: "Create review",
      method: "POST",
      path: "/api/reviews",
      headers: jsonHeaders,
      body: jsonBody({
        jobId: "job_benchmark",
        reviewerId: "usr_client",
        revieweeId: "usr_freelancer",
        rating: 5,
        comment:
          "Delivered the payment workflow on time with clear tests, useful handoff notes, and strong communication throughout the project."
      }),
      description: "Review payload with rating and human-readable comment."
    },
    {
      name: "List messages",
      method: "GET",
      path: "/api/messages",
      description: "Message listing endpoint."
    },
    {
      name: "Create message",
      method: "POST",
      path: "/api/messages",
      headers: jsonHeaders,
      body: jsonBody({
        threadId: "thread_benchmark_project",
        senderId: "usr_client",
        recipientId: "usr_freelancer",
        body:
          "Can you share the latest milestone demo, risk notes, and the remaining checklist before we approve the escrow release?"
      }),
      description: "Message payload representative of project collaboration traffic."
    },
    {
      name: "List notifications",
      method: "GET",
      path: "/api/notifications",
      description: "Notification listing endpoint."
    },
    {
      name: "Create notification",
      method: "POST",
      path: "/api/notifications",
      headers: jsonHeaders,
      body: jsonBody({
        userId: "usr_freelancer",
        type: "milestone.approved",
        title: "Milestone approved",
        message: "The client approved the implementation milestone and released escrow.",
        metadata: {
          jobId: "job_benchmark",
          milestoneId: "milestone_implementation"
        }
      }),
      description: "Notification payload with metadata commonly used by activity feeds."
    },
    {
      name: "Upload attachment",
      method: "POST",
      path: "/api/uploads",
      headers: upload.headers,
      body: upload.body,
      description: "Small multipart attachment matching the upload middleware path."
    },
    {
      name: "Search marketplace",
      method: "GET",
      path: "/api/search?q=senior%20react%20payments",
      description: "Search route with a representative keyword query."
    },
    {
      name: "Admin metrics",
      method: "GET",
      path: "/api/admin/metrics",
      headers: authHeaders,
      protected: true,
      description: "Auth-protected admin metrics endpoint using the benchmark token."
    }
  ];
}
