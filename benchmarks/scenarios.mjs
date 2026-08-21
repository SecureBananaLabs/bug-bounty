export function createScenarios({ authToken }) {
  const json = { "content-type": "application/json" };
  const auth = { authorization: `Bearer ${authToken}` };

  return [
    { name: "health", method: "GET", path: "/health" },
    {
      name: "auth register",
      method: "POST",
      path: "/api/auth/register",
      headers: json,
      json: (i) => ({
        email: `bench-register-${i}@example.com`,
        password: "benchmark-password",
        role: "client"
      })
    },
    {
      name: "auth login",
      method: "POST",
      path: "/api/auth/login",
      headers: json,
      json: () => ({ email: "bench-login@example.com", password: "benchmark-password" })
    },
    { name: "auth oauth callback", method: "GET", path: "/api/auth/oauth/github/callback" },
    { name: "auth refresh", method: "POST", path: "/api/auth/refresh", headers: json, json: () => ({}) },
    { name: "users list", method: "GET", path: "/api/users" },
    {
      name: "users create",
      method: "POST",
      path: "/api/users",
      headers: json,
      json: (i) => ({ email: `bench-user-${i}@example.com`, role: "freelancer", status: "active" })
    },
    { name: "jobs list", method: "GET", path: "/api/jobs" },
    {
      name: "jobs create",
      method: "POST",
      path: "/api/jobs",
      headers: json,
      json: (i) => ({
        title: `Benchmark job ${i}`,
        description: "Synthetic benchmark job payload for API load testing.",
        budgetMin: 500,
        budgetMax: 2500,
        categoryId: "cat_web",
        skills: ["node", "api", "testing"]
      })
    },
    { name: "proposals list", method: "GET", path: "/api/proposals" },
    {
      name: "proposals create",
      method: "POST",
      path: "/api/proposals",
      headers: json,
      json: (i) => ({ jobId: `job_${i}`, freelancerId: "usr_benchmark", bidAmount: 1200, coverLetter: "Benchmark proposal" })
    },
    {
      name: "payments create",
      method: "POST",
      path: "/api/payments",
      headers: json,
      json: () => ({ amount: 1299, currency: "usd", metadata: { source: "benchmark" } })
    },
    { name: "reviews list", method: "GET", path: "/api/reviews" },
    {
      name: "reviews create",
      method: "POST",
      path: "/api/reviews",
      headers: json,
      json: (i) => ({ jobId: `job_${i}`, rating: 5, comment: "Benchmark review" })
    },
    { name: "messages list", method: "GET", path: "/api/messages" },
    {
      name: "messages create",
      method: "POST",
      path: "/api/messages",
      headers: json,
      json: (i) => ({ conversationId: `conv_${i}`, senderId: "usr_benchmark", body: "Benchmark message body" })
    },
    { name: "notifications list", method: "GET", path: "/api/notifications" },
    {
      name: "notifications create",
      method: "POST",
      path: "/api/notifications",
      headers: json,
      json: (i) => ({ userId: `usr_${i}`, type: "benchmark", message: "Benchmark notification" })
    },
    {
      name: "uploads create",
      method: "POST",
      path: "/api/uploads",
      formData: () => {
        const body = new FormData();
        body.append("file", new Blob(["benchmark upload payload"], { type: "text/plain" }), "benchmark.txt");
        return body;
      }
    },
    { name: "search query", method: "GET", path: "/api/search?q=freelance" },
    { name: "admin metrics", method: "GET", path: "/api/admin/metrics", headers: auth }
  ];
}
