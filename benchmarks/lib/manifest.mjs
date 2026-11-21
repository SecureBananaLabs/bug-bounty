import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const benchmarkRoot = path.resolve(__dirname, "..");

function jsonBody(body) {
  return {
    headers: {"content-type": "application/json"},
    body,
  };
}

export function buildRouteManifest() {
  const stamp = Date.now();
  const endpoints = [
    {method: "GET", path: "/health", expectedStatuses: [200]},
    {
      method: "POST",
      path: "/api/auth/register",
      expectedStatuses: [201],
      ...jsonBody({email: `bench-${stamp}@example.com`, password: "benchmark-pass", role: "admin"}),
    },
    {
      method: "POST",
      path: "/api/auth/login",
      expectedStatuses: [200],
      ...jsonBody({email: "bench-existing@example.com", password: "benchmark-pass"}),
    },
    {method: "GET", path: "/api/auth/oauth/github/callback", expectedStatuses: [200]},
    {method: "POST", path: "/api/auth/refresh", expectedStatuses: [200]},
    {method: "GET", path: "/api/users", expectedStatuses: [200]},
    {method: "POST", path: "/api/users", expectedStatuses: [201], ...jsonBody({email: `user-${stamp}@example.com`, role: "freelancer"})},
    {method: "GET", path: "/api/jobs", expectedStatuses: [200]},
    {
      method: "POST",
      path: "/api/jobs",
      expectedStatuses: [201],
      ...jsonBody({
        title: "Benchmark API audit",
        description: "Synthetic payload for local benchmark coverage",
        budgetMin: 100,
        budgetMax: 500,
        categoryId: "engineering",
        skills: ["node", "api"],
      }),
    },
    {method: "GET", path: "/api/proposals", expectedStatuses: [200]},
    {method: "POST", path: "/api/proposals", expectedStatuses: [201], ...jsonBody({jobId: "job_benchmark", freelancerId: "usr_benchmark", bid: 300})},
    {method: "POST", path: "/api/payments", expectedStatuses: [201], ...jsonBody({amount: 250, currency: "usd", jobId: "job_benchmark"})},
    {method: "GET", path: "/api/reviews", expectedStatuses: [200]},
    {method: "POST", path: "/api/reviews", expectedStatuses: [201], ...jsonBody({jobId: "job_benchmark", rating: 5, body: "Synthetic review"})},
    {method: "GET", path: "/api/messages", expectedStatuses: [200]},
    {method: "POST", path: "/api/messages", expectedStatuses: [201], ...jsonBody({threadId: "thread_benchmark", message: "Synthetic benchmark message"})},
    {method: "GET", path: "/api/notifications", expectedStatuses: [200]},
    {method: "POST", path: "/api/notifications", expectedStatuses: [201], ...jsonBody({userId: "usr_benchmark", message: "Synthetic benchmark notification"})},
    {method: "POST", path: "/api/uploads", expectedStatuses: [201], upload: true},
    {method: "GET", path: "/api/search?q=benchmark", expectedStatuses: [200]},
    {method: "GET", path: "/api/admin/metrics", expectedStatuses: [200], requiresAuth: true},
  ];

  return {
    name: "freelance-platform-api",
    targetEnv: "local-or-staging",
    endpoints: endpoints.map((endpoint) => ({id: `${endpoint.method} ${endpoint.path}`, ...endpoint})),
  };
}

export function loadThresholds() {
  const thresholdsPath = path.join(benchmarkRoot, "thresholds.json");
  return JSON.parse(fs.readFileSync(thresholdsPath, "utf8"));
}
