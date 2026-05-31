const timestamp = () => Date.now();

const benchmarkIds = {
  client: "usr_bench_client",
  freelancer: "usr_bench_freelancer",
  job: "job_bench_marketplace_api",
  proposal: "prp_bench_marketplace_api",
  category: "cat_bench_development"
};

export const endpoints = [
  {
    name: "Register user",
    method: "POST",
    path: "/api/auth/register",
    body: () => ({
      email: `bench+${timestamp()}@example.com`,
      password: "benchmark-password",
      role: "client"
    })
  },
  {
    name: "Login user",
    method: "POST",
    path: "/api/auth/login",
    body: () => ({
      email: "bench.client@example.com",
      password: "benchmark-password"
    })
  },
  {
    name: "OAuth callback",
    method: "GET",
    path: "/api/auth/oauth/github/callback?code=benchmark-code&state=benchmark-state"
  },
  {
    name: "Refresh token",
    method: "POST",
    path: "/api/auth/refresh"
  },
  {
    name: "List users",
    method: "GET",
    path: "/api/users"
  },
  {
    name: "Create user",
    method: "POST",
    path: "/api/users",
    body: () => ({
      email: `bench.user.${timestamp()}@example.com`,
      fullName: "Benchmark User",
      passwordHash: "benchmark-password-hash",
      role: "FREELANCER",
      bio: "Full-stack marketplace engineer benchmark profile",
      skills: ["node", "express", "postgres"]
    })
  },
  {
    name: "List jobs",
    method: "GET",
    path: "/api/jobs"
  },
  {
    name: "Create job",
    method: "POST",
    path: "/api/jobs",
    body: () => ({
      title: "Build marketplace API performance dashboard",
      description: "Design, implement, and document a production-ready API performance dashboard for marketplace operators.",
      budgetMin: 1200,
      budgetMax: 3500,
      categoryId: benchmarkIds.category,
      skills: ["node", "express", "observability", "load-testing"]
    })
  },
  {
    name: "List proposals",
    method: "GET",
    path: "/api/proposals"
  },
  {
    name: "Create proposal",
    method: "POST",
    path: "/api/proposals",
    body: () => ({
      coverLetter: "I can deliver the benchmark dashboard with reproducible metrics, CI smoke gates, and documentation.",
      bidAmount: 2400,
      estDuration: "2 weeks",
      jobId: benchmarkIds.job,
      freelancerId: benchmarkIds.freelancer
    })
  },
  {
    name: "Create payment",
    method: "POST",
    path: "/api/payments",
    body: () => ({
      amount: 750,
      currency: "usd",
      jobId: benchmarkIds.job,
      status: "pending"
    })
  },
  {
    name: "List reviews",
    method: "GET",
    path: "/api/reviews"
  },
  {
    name: "Create review",
    method: "POST",
    path: "/api/reviews",
    body: () => ({
      rating: 5,
      comment: "Fast delivery with clear benchmark evidence and reliable reporting.",
      reviewerId: benchmarkIds.client,
      revieweeId: benchmarkIds.freelancer
    })
  },
  {
    name: "List messages",
    method: "GET",
    path: "/api/messages"
  },
  {
    name: "Send message",
    method: "POST",
    path: "/api/messages",
    body: () => ({
      body: "Can you share the latest benchmark summary and p99 regression status?",
      senderId: benchmarkIds.client,
      receiverId: benchmarkIds.freelancer
    })
  },
  {
    name: "List notifications",
    method: "GET",
    path: "/api/notifications"
  },
  {
    name: "Create notification",
    method: "POST",
    path: "/api/notifications",
    body: () => ({
      userId: benchmarkIds.client,
      title: "Benchmark report ready",
      body: "The API benchmark summary has been generated and is ready for review."
    })
  },
  {
    name: "Upload file",
    method: "POST",
    path: "/api/uploads",
    multipart: () => ({
      fieldName: "file",
      filename: "benchmark-profile.txt",
      type: "text/plain",
      content: "Benchmark upload payload representing a freelancer profile attachment.\n"
    })
  },
  {
    name: "Search marketplace",
    method: "GET",
    path: "/api/search?q=node%20express%20benchmark"
  },
  {
    name: "Admin metrics",
    method: "GET",
    path: "/api/admin/metrics",
    auth: true
  }
];

export function endpointKey(endpoint) {
  return `${endpoint.method} ${endpoint.path.split("?")[0]}`;
}
