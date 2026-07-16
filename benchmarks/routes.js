export const apiBenchmarks = [
  {
    name: "Register client",
    method: "POST",
    path: "/api/auth/register",
    payloadKind: "json",
    buildRequest: ({ runId, sequence }) => ({
      email: `benchmark.${runId}.client.${sequence}@example.com`,
      password: "benchmark-password-2026",
      role: "client"
    })
  },
  {
    name: "Login client",
    method: "POST",
    path: "/api/auth/login",
    payloadKind: "json",
    buildRequest: ({ runId, sequence }) => ({
      email: `benchmark.${runId}.client.${sequence}@example.com`,
      password: "benchmark-password-2026"
    })
  },
  {
    name: "OAuth callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback?code=benchmark-code&state=benchmark-state",
    pathPattern: "/api/auth/oauth/:provider/callback"
  },
  {
    name: "Refresh token",
    method: "POST",
    path: "/api/auth/refresh"
  },
  {
    name: "Create user",
    method: "POST",
    path: "/api/users",
    payloadKind: "json",
    buildRequest: ({ runId, sequence }) => ({
      email: `freelancer.${runId}.${sequence}@example.com`,
      fullName: `Benchmark Freelancer ${sequence}`,
      role: "freelancer",
      passwordHash: "benchmark-password-hash",
      isVerified: true,
      bio: "Senior full-stack developer focused on marketplace integrations.",
      profile: {
        title: "Senior full-stack developer",
        hourlyRate: 95,
        skills: ["node.js", "react", "payments", "postgres"],
        summary: "Synthetic benchmark profile with realistic nested metadata."
      }
    })
  },
  {
    name: "List users",
    method: "GET",
    path: "/api/users"
  },
  {
    name: "Create job",
    method: "POST",
    path: "/api/jobs",
    payloadKind: "json",
    buildRequest: ({ runId, sequence }) => ({
      title: `Marketplace API integration ${runId}-${sequence}`,
      description: "Build a production-ready integration for a freelance marketplace, including webhook handling, retries, observability, and admin reporting.",
      budgetMin: 4500,
      budgetMax: 12000,
      categoryId: "software-development",
      skills: ["node.js", "express", "stripe", "observability", "postgres"]
    })
  },
  {
    name: "List jobs",
    method: "GET",
    path: "/api/jobs"
  },
  {
    name: "Create proposal",
    method: "POST",
    path: "/api/proposals",
    payloadKind: "json",
    buildRequest: ({ runId, sequence }) => ({
      jobId: `job_${runId}_${sequence}`,
      freelancerId: `usr_${runId}_${sequence}`,
      bidAmount: 8200,
      estDuration: "21 days",
      coverLetter: "I have delivered similar marketplace API integrations with payment flows, audit trails, and operational dashboards."
    })
  },
  {
    name: "List proposals",
    method: "GET",
    path: "/api/proposals"
  },
  {
    name: "Create payment",
    method: "POST",
    path: "/api/payments",
    payloadKind: "json",
    buildRequest: ({ runId, sequence }) => ({
      invoiceId: `inv_${runId}_${sequence}`,
      jobId: `job_${runId}_${sequence}`,
      amount: 8200,
      currency: "USD",
      status: "authorized",
      stripeRef: `pi_${runId}_${sequence}`,
      paymentMethod: "card",
      metadata: {
        milestone: "final-delivery",
        clientSegment: "enterprise"
      }
    })
  },
  {
    name: "Create review",
    method: "POST",
    path: "/api/reviews",
    payloadKind: "json",
    buildRequest: ({ runId, sequence }) => ({
      jobId: `job_${runId}_${sequence}`,
      reviewerId: `usr_client_${runId}_${sequence}`,
      revieweeId: `usr_freelancer_${runId}_${sequence}`,
      rating: 5,
      comment: "Delivered on time, communicated clearly, and provided strong production handoff notes."
    })
  },
  {
    name: "List reviews",
    method: "GET",
    path: "/api/reviews"
  },
  {
    name: "Create message",
    method: "POST",
    path: "/api/messages",
    payloadKind: "json",
    buildRequest: ({ runId, sequence }) => ({
      conversationId: `conv_${runId}_${sequence % 10}`,
      senderId: `usr_client_${runId}_${sequence}`,
      receiverId: `usr_freelancer_${runId}_${sequence}`,
      body: "Can you share the latest deployment checklist, monitoring screenshots, and remaining milestone blockers?"
    })
  },
  {
    name: "List messages",
    method: "GET",
    path: "/api/messages"
  },
  {
    name: "Create notification",
    method: "POST",
    path: "/api/notifications",
    payloadKind: "json",
    buildRequest: ({ runId, sequence }) => ({
      userId: `usr_${runId}_${sequence}`,
      type: "proposal.updated",
      title: "Proposal status changed",
      body: "Your proposal moved to final review.",
      read: false,
      metadata: {
        proposalId: `prp_${runId}_${sequence}`,
        priority: "normal"
      }
    })
  },
  {
    name: "List notifications",
    method: "GET",
    path: "/api/notifications"
  },
  {
    name: "Upload portfolio asset",
    method: "POST",
    path: "/api/uploads",
    payloadKind: "multipart",
    buildRequest: ({ runId, sequence }) => {
      const body = JSON.stringify({
        id: sequence,
        runId,
        kind: "portfolio-sample",
        description: "Synthetic benchmark upload payload"
      }).repeat(20);
      return {
        fieldName: "file",
        filename: `portfolio-${sequence}.json`,
        contentType: "application/json",
        body
      };
    }
  },
  {
    name: "Search marketplace",
    method: "GET",
    path: "/api/search?q=node%20stripe%20marketplace%20dashboard"
  },
  {
    name: "Admin metrics",
    method: "GET",
    path: "/api/admin/metrics",
    auth: "benchmark"
  }
];
