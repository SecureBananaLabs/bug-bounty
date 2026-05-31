const jsonHeaders = {
  "content-type": "application/json"
};

const textBlock = [
  "FreelanceFlow benchmark payload",
  "Scope includes project discovery, proposal review, messaging, payment setup and notification flows.",
  "This body is intentionally longer than a trivial fixture so the request size better resembles normal API usage."
].join(" ");

const uploadBoundary = "----freelanceflow-benchmark-boundary";
const uploadBody = [
  `--${uploadBoundary}`,
  'Content-Disposition: form-data; name="file"; filename="benchmark-brief.txt"',
  "Content-Type: text/plain",
  "",
  textBlock.repeat(20),
  `--${uploadBoundary}--`,
  ""
].join("\r\n");

export function getBenchmarkEndpoints({ token }) {
  const authHeaders = {
    authorization: `Bearer ${token}`
  };

  return [
    {
      name: "POST /api/auth/register",
      method: "POST",
      path: "/api/auth/register",
      headers: jsonHeaders,
      body: JSON.stringify({
        email: "benchmark.client@example.com",
        password: "benchmark-password",
        role: "client"
      })
    },
    {
      name: "POST /api/auth/login",
      method: "POST",
      path: "/api/auth/login",
      headers: jsonHeaders,
      body: JSON.stringify({
        email: "benchmark.client@example.com",
        password: "benchmark-password"
      })
    },
    {
      name: "GET /api/auth/oauth/:provider/callback",
      method: "GET",
      path: "/api/auth/oauth/github/callback"
    },
    {
      name: "POST /api/auth/refresh",
      method: "POST",
      path: "/api/auth/refresh",
      headers: jsonHeaders,
      body: "{}"
    },
    {
      name: "GET /api/users",
      method: "GET",
      path: "/api/users"
    },
    {
      name: "POST /api/users",
      method: "POST",
      path: "/api/users",
      headers: jsonHeaders,
      body: JSON.stringify({
        email: "benchmark.freelancer@example.com",
        name: "Benchmark Freelancer",
        role: "freelancer",
        hourlyRate: 125,
        skills: ["brand systems", "motion design", "frontend delivery"]
      })
    },
    {
      name: "GET /api/jobs",
      method: "GET",
      path: "/api/jobs"
    },
    {
      name: "POST /api/jobs",
      method: "POST",
      path: "/api/jobs",
      headers: jsonHeaders,
      body: JSON.stringify({
        title: "Design system implementation",
        description: textBlock.repeat(6),
        budgetMin: 5000,
        budgetMax: 12000,
        categoryId: "cat_design_systems",
        skills: ["React", "Next.js", "design systems", "accessibility", "performance"]
      })
    },
    {
      name: "GET /api/proposals",
      method: "GET",
      path: "/api/proposals"
    },
    {
      name: "POST /api/proposals",
      method: "POST",
      path: "/api/proposals",
      headers: jsonHeaders,
      body: JSON.stringify({
        jobId: "job_benchmark",
        freelancerId: "usr_benchmark_freelancer",
        coverLetter: textBlock.repeat(5),
        price: 8500,
        estimatedDays: 21
      })
    },
    {
      name: "POST /api/payments",
      method: "POST",
      path: "/api/payments",
      headers: jsonHeaders,
      body: JSON.stringify({
        jobId: "job_benchmark",
        amount: 8500,
        currency: "usd",
        paymentMethodId: "pm_benchmark_card"
      })
    },
    {
      name: "GET /api/reviews",
      method: "GET",
      path: "/api/reviews"
    },
    {
      name: "POST /api/reviews",
      method: "POST",
      path: "/api/reviews",
      headers: jsonHeaders,
      body: JSON.stringify({
        jobId: "job_benchmark",
        reviewerId: "usr_benchmark_client",
        revieweeId: "usr_benchmark_freelancer",
        rating: 5,
        comment: textBlock.repeat(2)
      })
    },
    {
      name: "GET /api/messages",
      method: "GET",
      path: "/api/messages"
    },
    {
      name: "POST /api/messages",
      method: "POST",
      path: "/api/messages",
      headers: jsonHeaders,
      body: JSON.stringify({
        conversationId: "cnv_benchmark",
        senderId: "usr_benchmark_client",
        recipientId: "usr_benchmark_freelancer",
        body: textBlock.repeat(4)
      })
    },
    {
      name: "GET /api/notifications",
      method: "GET",
      path: "/api/notifications"
    },
    {
      name: "POST /api/notifications",
      method: "POST",
      path: "/api/notifications",
      headers: jsonHeaders,
      body: JSON.stringify({
        userId: "usr_benchmark_client",
        type: "proposal_received",
        title: "New proposal received",
        body: textBlock.repeat(2)
      })
    },
    {
      name: "POST /api/uploads",
      method: "POST",
      path: "/api/uploads",
      headers: {
        "content-type": `multipart/form-data; boundary=${uploadBoundary}`
      },
      body: uploadBody
    },
    {
      name: "GET /api/search",
      method: "GET",
      path: "/api/search?q=design%20systems%20react"
    },
    {
      name: "GET /api/admin/metrics",
      method: "GET",
      path: "/api/admin/metrics",
      headers: authHeaders
    }
  ];
}
