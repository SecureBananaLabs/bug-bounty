// Benchmark configuration
export const BASE_URL = __ENV.TARGET_HOST || "http://localhost:3001";
export const AUTH_TOKEN = __ENV.BENCHMARK_TOKEN || "";

export const ENDPOINTS = [
  { name: "GET /api/jobs", method: "GET", path: "/api/jobs", tags: { type: "read" } },
  { name: "POST /api/auth/login", method: "POST", path: "/api/auth/login", tags: { type: "auth" },
    payload: { email: "benchmark@test.com", password: "benchmark123" } },
  { name: "GET /api/users/me", method: "GET", path: "/api/users/me", tags: { type: "read" }, auth: true },
  { name: "GET /api/jobs/1", method: "GET", path: "/api/jobs/1", tags: { type: "read" } },
  { name: "GET /api/proposals", method: "GET", path: "/api/proposals", tags: { type: "read" }, auth: true },
  { name: "GET /api/messages", method: "GET", path: "/api/messages", tags: { type: "read" }, auth: true },
  { name: "GET /api/notifications", method: "GET", path: "/api/notifications", tags: { type: "read" }, auth: true },
  { name: "GET /api/reviews", method: "GET", path: "/api/reviews", tags: { type: "read" } },
  { name: "GET /api/search", method: "GET", path: "/api/search?q=developer", tags: { type: "search" } },
];

export const DEFAULT_THRESHOLDS = {
  http_req_duration: ["p(99)<2000", "p(95)<1000", "p(50)<300"],
  http_req_failed: ["rate<0.05"],
  http_reqs: ["rate>50"],
};
