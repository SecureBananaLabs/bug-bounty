function jsonRequest(body, headers = {}) {
  return {
    headers: {
      "content-type": "application/json",
      ...headers
    },
    body: JSON.stringify(body)
  };
}

function uploadRequest(iteration) {
  const form = new FormData();
  form.set(
    "file",
    new Blob([`benchmark upload payload ${iteration}\n`.repeat(20)], { type: "text/plain" }),
    `benchmark-${iteration}.txt`
  );
  return { body: form };
}

export function buildBenchmarkEndpoints({ authToken }) {
  const authHeaders = authToken ? { authorization: `Bearer ${authToken}` } : {};

  return [
    {
      name: "auth.register",
      method: "POST",
      path: "/api/auth/register",
      buildRequest: ({ iteration }) =>
        jsonRequest({
          email: `benchmark+${Date.now()}-${iteration}@example.com`,
          password: "benchmark-pass-123",
          role: "client"
        })
    },
    {
      name: "auth.login",
      method: "POST",
      path: "/api/auth/login",
      buildRequest: ({ iteration }) =>
        jsonRequest({
          email: `existing-${iteration}@example.com`,
          password: "benchmark-pass-123"
        })
    },
    {
      name: "auth.oauthCallback",
      method: "GET",
      path: "/api/auth/oauth/github/callback"
    },
    {
      name: "auth.refresh",
      method: "POST",
      path: "/api/auth/refresh"
    },
    {
      name: "users.list",
      method: "GET",
      path: "/api/users"
    },
    {
      name: "users.create",
      method: "POST",
      path: "/api/users",
      buildRequest: ({ iteration }) =>
        jsonRequest({
          email: `user-${iteration}@example.com`,
          fullName: "Benchmark User",
          role: "client",
          bio: "Synthetic user payload for API benchmark coverage."
        })
    },
    {
      name: "jobs.list",
      method: "GET",
      path: "/api/jobs"
    },
    {
      name: "jobs.create",
      method: "POST",
      path: "/api/jobs",
      buildRequest: ({ iteration }) =>
        jsonRequest({
          title: `Benchmark API job ${iteration}`,
          description: "Synthetic project description with realistic payload length for benchmark runs.",
          budgetMin: 500,
          budgetMax: 2500,
          categoryId: "cat_engineering",
          skills: ["node", "api", "testing"]
        })
    },
    {
      name: "proposals.list",
      method: "GET",
      path: "/api/proposals"
    },
    {
      name: "proposals.create",
      method: "POST",
      path: "/api/proposals",
      buildRequest: ({ iteration }) =>
        jsonRequest({
          jobId: `job_${iteration}`,
          freelancerId: "usr_benchmark_freelancer",
          bidAmount: 1250,
          estDuration: "2 weeks",
          coverLetter: "Benchmark proposal payload that mirrors a normal short freelancer pitch."
        })
    },
    {
      name: "payments.create",
      method: "POST",
      path: "/api/payments",
      buildRequest: ({ iteration }) =>
        jsonRequest({
          jobId: `job_${iteration}`,
          amount: 125000,
          currency: "usd",
          metadata: {
            benchmark: true
          }
        })
    },
    {
      name: "reviews.list",
      method: "GET",
      path: "/api/reviews"
    },
    {
      name: "reviews.create",
      method: "POST",
      path: "/api/reviews",
      buildRequest: ({ iteration }) =>
        jsonRequest({
          reviewerId: "usr_client_benchmark",
          revieweeId: "usr_freelancer_benchmark",
          rating: 5,
          comment: `Benchmark review ${iteration}`
        })
    },
    {
      name: "messages.list",
      method: "GET",
      path: "/api/messages"
    },
    {
      name: "messages.create",
      method: "POST",
      path: "/api/messages",
      buildRequest: ({ iteration }) =>
        jsonRequest({
          senderId: "usr_client_benchmark",
          receiverId: "usr_freelancer_benchmark",
          body: `Benchmark message payload ${iteration}`
        })
    },
    {
      name: "notifications.list",
      method: "GET",
      path: "/api/notifications"
    },
    {
      name: "notifications.create",
      method: "POST",
      path: "/api/notifications",
      buildRequest: ({ iteration }) =>
        jsonRequest({
          userId: "usr_client_benchmark",
          title: `Benchmark notification ${iteration}`,
          body: "Synthetic notification body for benchmark load."
        })
    },
    {
      name: "uploads.create",
      method: "POST",
      path: "/api/uploads",
      buildRequest: ({ iteration }) => uploadRequest(iteration)
    },
    {
      name: "search.global",
      method: "GET",
      path: "/api/search?q=benchmark%20developer"
    },
    {
      name: "admin.metrics",
      method: "GET",
      path: "/api/admin/metrics",
      buildRequest: () => ({
        headers: authHeaders
      })
    }
  ];
}
