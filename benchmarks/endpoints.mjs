export function createEndpointBenchmarks({ adminToken, uploadFixturePath }) {
  return [
    {
      id: "GET /api/users",
      method: "GET",
      path: "/api/users"
    },
    {
      id: "POST /api/users",
      method: "POST",
      path: "/api/users",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: "benchmark-user+[<id>]@example.com",
        name: "Benchmark User",
        role: "freelancer",
        headline: "Full-stack engineer",
        location: "Berlin, DE"
      }),
      idReplacement: true
    },
    {
      id: "GET /api/jobs",
      method: "GET",
      path: "/api/jobs"
    },
    {
      id: "POST /api/jobs",
      method: "POST",
      path: "/api/jobs",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        title: "Build a SaaS dashboard",
        description: "Need a responsive dashboard with authentication, charts, and billing views.",
        budgetMin: 5000,
        budgetMax: 12000,
        categoryId: "web-development",
        skills: ["react", "node", "postgresql"]
      })
    },
    {
      id: "GET /api/proposals",
      method: "GET",
      path: "/api/proposals"
    },
    {
      id: "POST /api/proposals",
      method: "POST",
      path: "/api/proposals",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        jobId: "job_000001",
        freelancerId: "usr_000001",
        coverLetter: "I can deliver this in two milestones with weekly demos.",
        proposedBudget: 9800,
        timelineDays: 21
      })
    },
    {
      id: "POST /api/payments",
      method: "POST",
      path: "/api/payments",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        amount: 9900,
        currency: "usd",
        jobId: "job_000001",
        payerId: "usr_000001",
        provider: "stripe"
      })
    },
    {
      id: "GET /api/reviews",
      method: "GET",
      path: "/api/reviews"
    },
    {
      id: "POST /api/reviews",
      method: "POST",
      path: "/api/reviews",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        reviewerId: "usr_000001",
        revieweeId: "usr_000002",
        rating: 5,
        comment: "Delivered ahead of schedule and communicated clearly."
      })
    },
    {
      id: "GET /api/messages",
      method: "GET",
      path: "/api/messages"
    },
    {
      id: "POST /api/messages",
      method: "POST",
      path: "/api/messages",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        conversationId: "convo_001",
        senderId: "usr_000001",
        recipientId: "usr_000002",
        message: "Can we confirm the launch milestone for next Friday?"
      })
    },
    {
      id: "GET /api/notifications",
      method: "GET",
      path: "/api/notifications"
    },
    {
      id: "POST /api/notifications",
      method: "POST",
      path: "/api/notifications",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        userId: "usr_000001",
        type: "proposal_received",
        title: "New proposal received",
        message: "A freelancer submitted a proposal for your job."
      })
    },
    {
      id: "POST /api/uploads",
      method: "POST",
      path: "/api/uploads",
      form: {
        file: {
          type: "file",
          path: uploadFixturePath,
          options: {
            filename: "upload-sample.txt"
          }
        }
      }
    },
    {
      id: "GET /api/search",
      method: "GET",
      path: "/api/search?q=senior%20full-stack%20developer"
    },
    {
      id: "GET /api/auth/oauth/github/callback",
      method: "GET",
      path: "/api/auth/oauth/github/callback"
    },
    {
      id: "POST /api/auth/register",
      method: "POST",
      path: "/api/auth/register",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: "benchmark-register+[<id>]@example.com",
        password: "BenchmarkPass123!",
        role: "freelancer"
      }),
      idReplacement: true
    },
    {
      id: "POST /api/auth/login",
      method: "POST",
      path: "/api/auth/login",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: "benchmark-login@example.com",
        password: "BenchmarkPass123!"
      })
    },
    {
      id: "POST /api/auth/refresh",
      method: "POST",
      path: "/api/auth/refresh",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        refreshToken: "benchmark-refresh-token"
      })
    },
    {
      id: "GET /api/admin/metrics",
      method: "GET",
      path: "/api/admin/metrics",
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    }
  ];
}
