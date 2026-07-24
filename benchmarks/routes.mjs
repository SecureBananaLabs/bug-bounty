const jsonHeaders = {
  "content-type": "application/json"
};

const multipartBoundary = "benchmark-boundary";
const uploadBody = [
  `--${multipartBoundary}`,
  "Content-Disposition: form-data; name=\"file\"; filename=\"benchmark.txt\"",
  "Content-Type: text/plain",
  "",
  "benchmark upload payload",
  `--${multipartBoundary}--`,
  ""
].join("\r\n");

export const benchmarkRoutes = [
  {
    name: "POST /api/auth/register",
    method: "POST",
    path: "/api/auth/register",
    headers: jsonHeaders,
    body: {
      email: "benchmark-register@example.com",
      password: "benchmark-secret",
      role: "client"
    }
  },
  {
    name: "POST /api/auth/login",
    method: "POST",
    path: "/api/auth/login",
    headers: jsonHeaders,
    body: {
      email: "benchmark-login@example.com",
      password: "benchmark-secret"
    }
  },
  {
    name: "GET /api/auth/oauth/:provider/callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback"
  },
  {
    name: "POST /api/auth/refresh",
    method: "POST",
    path: "/api/auth/refresh"
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
    body: {
      email: "benchmark-user@example.com",
      role: "freelancer",
      profile: {
        displayName: "Benchmark User",
        skills: ["node", "api", "performance"]
      }
    }
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
    body: {
      title: "Benchmark API payload",
      description: "Representative job listing payload for benchmark load.",
      budgetMin: 500,
      budgetMax: 1200,
      categoryId: "cat_engineering",
      skills: ["node", "express", "testing"]
    }
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
    body: {
      jobId: "job_benchmark",
      freelancerId: "usr_freelancer",
      coverLetter: "I can deliver this benchmarked implementation safely.",
      bidAmount: 900,
      estimatedDays: 5
    }
  },
  {
    name: "POST /api/payments",
    method: "POST",
    path: "/api/payments",
    headers: jsonHeaders,
    body: {
      amount: 120000,
      currency: "usd",
      jobId: "job_benchmark",
      metadata: {
        source: "benchmark"
      }
    }
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
    body: {
      jobId: "job_benchmark",
      reviewerId: "usr_client",
      revieweeId: "usr_freelancer",
      rating: 5,
      comment: "Benchmark review payload."
    }
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
    body: {
      conversationId: "conv_benchmark",
      senderId: "usr_client",
      body: "Benchmark message payload."
    }
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
    body: {
      userId: "usr_client",
      type: "benchmark",
      message: "Benchmark notification payload."
    }
  },
  {
    name: "POST /api/uploads",
    method: "POST",
    path: "/api/uploads",
    headers: {
      "content-type": `multipart/form-data; boundary=${multipartBoundary}`
    },
    body: uploadBody
  },
  {
    name: "GET /api/search",
    method: "GET",
    path: "/api/search?q=benchmark"
  },
  {
    name: "GET /api/admin/metrics",
    method: "GET",
    path: "/api/admin/metrics",
    authRole: "admin"
  }
];
