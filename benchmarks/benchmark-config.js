/**
 * Benchmark Configuration
 * Defines all API endpoints, their methods, and test payloads.
 */
const config = {
  // Default target host
  target: process.env.BENCHMARK_TARGET || "http://localhost:3000",

  // Benchmark execution settings
  settings: {
    connections: parseInt(process.env.BENCHMARK_CONNECTIONS || "10"),
    duration: parseInt(process.env.BENCHMARK_DURATION || "10"),
    pipelining: 1,
  },

  // Quick mode for CI / smoke tests
  quickSettings: {
    connections: 2,
    duration: 3,
    pipelining: 1,
  },

  // Auth token for protected routes
  authToken: process.env.BENCHMARK_AUTH_TOKEN || "",

  // Endpoints to benchmark
  endpoints: [
    { name: "health", method: "GET", path: "/health", protected: false },
    { name: "auth-register", method: "POST", path: "/api/auth/register", protected: false, body: { email: "test@benchmark.com", password: "Test1234!", role: "freelancer" } },
    { name: "auth-login", method: "POST", path: "/api/auth/login", protected: false, body: { email: "test@benchmark.com", password: "Test1234!" } },
    { name: "auth-refresh", method: "POST", path: "/api/auth/refresh", protected: true },
    { name: "users-list", method: "GET", path: "/api/users", protected: true },
    { name: "users-me", method: "GET", path: "/api/users/me", protected: true },
    { name: "jobs-list", method: "GET", path: "/api/jobs?limit=10", protected: false },
    { name: "jobs-create", method: "POST", path: "/api/jobs", protected: true, body: { title: "Benchmark Test Job", description: "A test job for benchmarking", budgetMin: 100, budgetMax: 500, category: "development" } },
    { name: "proposals-list", method: "GET", path: "/api/proposals", protected: true },
    { name: "payments-list", method: "GET", path: "/api/payments", protected: true },
    { name: "reviews-list", method: "GET", path: "/api/reviews", protected: false },
    { name: "messages-list", method: "GET", path: "/api/messages", protected: true },
    { name: "notifications-list", method: "GET", path: "/api/notifications", protected: true },
    { name: "uploads-no-file", method: "POST", path: "/api/uploads", protected: true },
    { name: "search-query", method: "GET", path: "/api/search?q=javascript+developer", protected: false },
    { name: "admin-stats", method: "GET", path: "/api/admin/stats", protected: true },
  ],
};

module.exports = config;
