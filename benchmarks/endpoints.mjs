export const endpoints = [
  {
    id: "health",
    method: "GET",
    path: "/health",
    expectedStatus: 200,
    description: "Service liveness check"
  },
  {
    id: "auth-register",
    method: "POST",
    path: "/api/auth/register",
    expectedStatus: 201,
    description: "Client registration with JWT issuance",
    json: {
      email: "benchmark+{{runId}}-{{requestId}}@example.com",
      password: "BenchmarkPass123!",
      role: "client"
    }
  },
  {
    id: "auth-login",
    method: "POST",
    path: "/api/auth/login",
    expectedStatus: 200,
    description: "Password login with JWT issuance",
    json: {
      email: "benchmark-client@example.com",
      password: "BenchmarkPass123!"
    }
  },
  {
    id: "auth-oauth-callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback",
    expectedStatus: 200,
    description: "OAuth provider callback acknowledgement"
  },
  {
    id: "auth-refresh",
    method: "POST",
    path: "/api/auth/refresh",
    expectedStatus: 200,
    description: "Access-token refresh endpoint"
  },
  {
    id: "users-list",
    method: "GET",
    path: "/api/users",
    expectedStatus: 200,
    description: "User directory listing"
  },
  {
    id: "users-create",
    method: "POST",
    path: "/api/users",
    expectedStatus: 201,
    description: "Create user profile",
    json: {
      email: "freelancer+{{runId}}-{{requestId}}@example.com",
      name: "Benchmark Freelancer",
      role: "freelancer",
      hourlyRate: 85,
      skills: ["node", "api", "benchmarking"]
    }
  },
  {
    id: "jobs-list",
    method: "GET",
    path: "/api/jobs",
    expectedStatus: 200,
    description: "Open jobs listing"
  },
  {
    id: "jobs-create",
    method: "POST",
    path: "/api/jobs",
    expectedStatus: 201,
    description: "Create job post with realistic budget and skills",
    json: {
      title: "Build a freelancer analytics dashboard",
      description: "Create a dashboard that summarizes project spend, freelancer delivery health, proposal conversion, and payment status for a marketplace client.",
      budgetMin: 2500,
      budgetMax: 7500,
      categoryId: "cat_development",
      skills: ["typescript", "express", "analytics", "testing"]
    }
  },
  {
    id: "proposals-list",
    method: "GET",
    path: "/api/proposals",
    expectedStatus: 200,
    description: "Proposal inbox listing"
  },
  {
    id: "proposals-create",
    method: "POST",
    path: "/api/proposals",
    expectedStatus: 201,
    description: "Create freelancer proposal",
    json: {
      jobId: "job_benchmark",
      freelancerId: "usr_benchmark_freelancer",
      bidAmount: 4200,
      deliveryDays: 14,
      coverLetter: "I will ship the dashboard with tracked milestones, tests, and weekly review notes."
    }
  },
  {
    id: "payments-create",
    method: "POST",
    path: "/api/payments",
    expectedStatus: 201,
    description: "Create payment intent",
    json: {
      jobId: "job_benchmark",
      amount: 4200,
      currency: "usd",
      payerId: "usr_benchmark_client",
      payeeId: "usr_benchmark_freelancer"
    }
  },
  {
    id: "reviews-list",
    method: "GET",
    path: "/api/reviews",
    expectedStatus: 200,
    description: "Marketplace review listing"
  },
  {
    id: "reviews-create",
    method: "POST",
    path: "/api/reviews",
    expectedStatus: 201,
    description: "Create project review",
    json: {
      jobId: "job_benchmark",
      reviewerId: "usr_benchmark_client",
      revieweeId: "usr_benchmark_freelancer",
      rating: 5,
      comment: "Clear milestones, fast communication, and clean delivery artifacts."
    }
  },
  {
    id: "messages-list",
    method: "GET",
    path: "/api/messages",
    expectedStatus: 200,
    description: "Project message thread listing"
  },
  {
    id: "messages-create",
    method: "POST",
    path: "/api/messages",
    expectedStatus: 201,
    description: "Send project message",
    json: {
      threadId: "thr_benchmark",
      senderId: "usr_benchmark_client",
      recipientId: "usr_benchmark_freelancer",
      body: "Can you attach the latest milestone report before Friday review?"
    }
  },
  {
    id: "notifications-list",
    method: "GET",
    path: "/api/notifications",
    expectedStatus: 200,
    description: "Notification feed listing"
  },
  {
    id: "notifications-create",
    method: "POST",
    path: "/api/notifications",
    expectedStatus: 201,
    description: "Create notification event",
    json: {
      userId: "usr_benchmark_client",
      type: "proposal.received",
      message: "A freelancer submitted a proposal for your dashboard project.",
      metadata: {
        jobId: "job_benchmark",
        proposalId: "prp_benchmark"
      }
    }
  },
  {
    id: "uploads-create",
    method: "POST",
    path: "/api/uploads",
    expectedStatus: 201,
    description: "Upload a small project attachment",
    form: {
      file: {
        name: "benchmark-brief.txt",
        type: "text/plain",
        content: "Benchmark project brief attachment for upload endpoint validation.\n"
      }
    }
  },
  {
    id: "search-global",
    method: "GET",
    path: "/api/search",
    query: {
      q: "typescript dashboard payments"
    },
    expectedStatus: 200,
    description: "Global marketplace search"
  },
  {
    id: "admin-metrics",
    method: "GET",
    path: "/api/admin/metrics",
    expectedStatus: 200,
    description: "Protected admin metric summary",
    auth: "benchmark-admin"
  }
];
