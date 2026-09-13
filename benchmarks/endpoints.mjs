import { signAccessToken } from "../apps/api/src/utils/jwt.js";

const benchmarkToken = signAccessToken({
  sub: "benchmark-user",
  role: "admin"
});

function jsonBody(payload) {
  return {
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  };
}

function uploadBody() {
  const form = new FormData();
  form.set("file", new File(["benchmark upload"], "benchmark.txt", { type: "text/plain" }));
  return { body: form };
}

export const endpoints = [
  { name: "auth.register", method: "POST", path: "/api/auth/register", request: () => jsonBody({ email: `bench-${Date.now()}-${Math.random()}@example.com`, password: "benchmark-password", role: "client" }) },
  { name: "auth.login", method: "POST", path: "/api/auth/login", request: () => jsonBody({ email: "bench@example.com", password: "benchmark-password" }) },
  { name: "auth.refresh", method: "POST", path: "/api/auth/refresh", request: () => ({}) },
  { name: "auth.oauth.github", method: "GET", path: "/api/auth/oauth/github/callback", request: () => ({}) },
  { name: "users.list", method: "GET", path: "/api/users", request: () => ({}) },
  { name: "users.create", method: "POST", path: "/api/users", request: () => jsonBody({ name: "Benchmark User", email: `user-${Date.now()}-${Math.random()}@example.com`, role: "client" }) },
  { name: "jobs.list", method: "GET", path: "/api/jobs", request: () => ({}) },
  { name: "jobs.create", method: "POST", path: "/api/jobs", request: () => jsonBody({ title: "Benchmark marketplace task", description: "Synthetic benchmark payload for local API performance testing.", budgetMin: 100, budgetMax: 250, categoryId: "cat_benchmark", skills: ["api", "benchmark"] }) },
  { name: "proposals.list", method: "GET", path: "/api/proposals", request: () => ({}) },
  { name: "proposals.create", method: "POST", path: "/api/proposals", request: () => jsonBody({ jobId: "job_benchmark", freelancerId: "usr_benchmark", coverLetter: "Synthetic proposal benchmark payload.", amount: 150, estimatedDuration: "3 days" }) },
  { name: "payments.create", method: "POST", path: "/api/payments", request: () => jsonBody({ amount: 15000, currency: "usd", jobId: "job_benchmark" }) },
  { name: "reviews.list", method: "GET", path: "/api/reviews", request: () => ({}) },
  { name: "reviews.create", method: "POST", path: "/api/reviews", request: () => jsonBody({ reviewerId: "usr_client", revieweeId: "usr_freelancer", rating: 5, comment: "Synthetic benchmark review." }) },
  { name: "messages.list", method: "GET", path: "/api/messages", request: () => ({}) },
  { name: "messages.create", method: "POST", path: "/api/messages", request: () => jsonBody({ conversationId: "conv_benchmark", senderId: "usr_client", body: "Synthetic benchmark message." }) },
  { name: "notifications.list", method: "GET", path: "/api/notifications", request: () => ({}) },
  { name: "notifications.create", method: "POST", path: "/api/notifications", request: () => jsonBody({ userId: "usr_benchmark", message: "Synthetic benchmark notification.", type: "info" }) },
  { name: "uploads.create", method: "POST", path: "/api/uploads", request: uploadBody },
  { name: "search.global", method: "GET", path: "/api/search?q=benchmark", request: () => ({}) },
  { name: "admin.metrics", method: "GET", path: "/api/admin/metrics", request: () => ({ headers: { authorization: `Bearer ${benchmarkToken}` } }) }
];
