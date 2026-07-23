import jwt from "jsonwebtoken";

const TARGET_HOST = process.env.BENCHMARK_HOST ?? "self";
const JWT_SECRET = process.env.BENCHMARK_JWT_SECRET ?? "development-secret";
const SMOKE = process.env.BENCHMARK_SMOKE === "1";

function benchmarkToken() {
  const secret = process.env.BENCHMARK_TOKEN_SECRET ?? JWT_SECRET;
  return jwt.sign(
    { sub: "benchmark-client", role: "admin" },
    secret,
    { expiresIn: "1h" }
  );
}

const TOKEN = benchmarkToken();
const AUTH = { authorization: `Bearer ${TOKEN}` };

export const config = {
  targetHost: TARGET_HOST,
  smoke: SMOKE,
  smokeConnections: 2,
  smokeDuration: 5,
  defaultConnections: 50,
  defaultDuration: 20,
  defaultPipelining: 1,
  endpoints: [
    { name: "GET /health", method: "GET", path: "/health", auth: false,
      payload: null },

    { name: "POST /api/auth/register", method: "POST", path: "/api/auth/register", auth: false,
      payload: { email: `bench+${Date.now()}@example.com`, password: "Benchmark!123", name: "Benchmark User" } },
    { name: "POST /api/auth/login", method: "POST", path: "/api/auth/login", auth: false,
      payload: { email: "bench@example.com", password: "Benchmark!123" } },
    { name: "POST /api/auth/refresh", method: "POST", path: "/api/auth/refresh", auth: false,
      payload: { refreshToken: "benchmark-refresh-token" } },

    { name: "GET /api/users", method: "GET", path: "/api/users", auth: true, payload: null },
    { name: "POST /api/users", method: "POST", path: "/api/users", auth: true,
      payload: { email: "bench-user@example.com", name: "Bench", role: "freelancer" } },

    { name: "GET /api/jobs", method: "GET", path: "/api/jobs", auth: true, payload: null },
    { name: "POST /api/jobs", method: "POST", path: "/api/jobs", auth: true,
      payload: { title: "Benchmark Job", description: "Load test job posting", budget: 1000, category: "web" } },

    { name: "GET /api/proposals", method: "GET", path: "/api/proposals", auth: true, payload: null },
    { name: "POST /api/proposals", method: "POST", path: "/api/proposals", auth: true,
      payload: { jobId: 1, coverLetter: "Benchmark proposal cover letter", rate: 50 } },

    { name: "POST /api/payments", method: "POST", path: "/api/payments", auth: true,
      payload: { jobId: 1, amount: 500, currency: "usd", method: "card" } },

    { name: "GET /api/reviews", method: "GET", path: "/api/reviews", auth: true, payload: null },
    { name: "POST /api/reviews", method: "POST", path: "/api/reviews", auth: true,
      payload: { jobId: 1, rating: 5, comment: "Benchmark review comment" } },

    { name: "GET /api/messages", method: "GET", path: "/api/messages", auth: true, payload: null },
    { name: "POST /api/messages", method: "POST", path: "/api/messages", auth: true,
      payload: { receiverId: 2, content: "Benchmark message payload" } },

    { name: "GET /api/notifications", method: "GET", path: "/api/notifications", auth: true, payload: null },
    { name: "POST /api/notifications", method: "POST", path: "/api/notifications", auth: true,
      payload: { userId: 2, type: "info", message: "Benchmark notification" } },

    { name: "POST /api/uploads", method: "POST", path: "/api/uploads", auth: true,
      payload: null, multipart: true },

    { name: "GET /api/search", method: "GET", path: "/api/search?q=benchmark", auth: true, payload: null },

    { name: "GET /api/admin/metrics", method: "GET", path: "/api/admin/metrics", auth: true, payload: null }
  ]
};
