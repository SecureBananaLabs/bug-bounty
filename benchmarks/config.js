/**
 * Benchmark configuration for all /api/ endpoints.
 *
 * Each entry defines:
 *   - method / path: the endpoint
 *   - label: display name for reports
 *   - payload: realistic request body (if applicable)
 *   - headers: additional headers (e.g. auth token placeholder)
 *   - weight: relative request share during mixed-load testing
 */

export const BENCHMARK_ENDPOINTS = [
  // ── Auth ──────────────────────────────────────────────────────────
  {
    method: "POST",
    path: "/api/auth/register",
    label: "Register",
    payload: { email: "bench@test.local", password: "BenchPass123!", name: "Bench User" },
    weight: 5,
  },
  {
    method: "POST",
    path: "/api/auth/login",
    label: "Login",
    payload: { email: "bench@test.local", password: "BenchPass123!" },
    weight: 10,
  },
  {
    method: "GET",
    path: "/api/auth/me",
    label: "Auth Me",
    auth: true,
    weight: 10,
  },

  // ── Users ─────────────────────────────────────────────────────────
  {
    method: "GET",
    path: "/api/users",
    label: "List Users",
    auth: true,
    weight: 8,
  },
  {
    method: "GET",
    path: "/api/users/me",
    label: "Get My Profile",
    auth: true,
    weight: 10,
  },
  {
    method: "PUT",
    path: "/api/users/me",
    label: "Update Profile",
    auth: true,
    payload: { name: "Bench Updated", bio: "Performance test user" },
    weight: 3,
  },

  // ── Jobs ──────────────────────────────────────────────────────────
  {
    method: "GET",
    path: "/api/jobs",
    label: "List Jobs",
    weight: 15,
  },
  {
    method: "GET",
    path: "/api/jobs?page=2&limit=20",
    label: "List Jobs (Paginated)",
    weight: 10,
  },
  {
    method: "GET",
    path: "/api/jobs?search=react&remote=true",
    label: "Search Jobs",
    weight: 8,
  },
  {
    method: "GET",
    path: "/api/jobs/00000000-0000-0000-0000-000000000001",
    label: "Get Job Detail",
    weight: 10,
  },
  {
    method: "POST",
    path: "/api/jobs",
    label: "Create Job",
    auth: true,
    payload: {
      title: "Senior Full-Stack Developer",
      description: "Looking for an experienced developer to join our platform team.",
      budgetMin: 5000,
      budgetMax: 12000,
      currency: "USD",
      category: "engineering",
      skills: ["react", "node", "postgresql", "aws"],
      duration: "3_months",
      experienceLevel: "senior",
    },
    weight: 5,
  },

  // ── Proposals ─────────────────────────────────────────────────────
  {
    method: "GET",
    path: "/api/proposals",
    label: "List Proposals",
    auth: true,
    weight: 8,
  },
  {
    method: "POST",
    path: "/api/proposals",
    label: "Create Proposal",
    auth: true,
    payload: {
      jobId: "00000000-0000-0000-0000-000000000001",
      coverLetter: "I am very interested in this position and have extensive experience in all required technologies.",
      bidAmount: 8000,
      estimatedDays: 30,
    },
    weight: 4,
  },

  // ── Messages ──────────────────────────────────────────────────────
  {
    method: "GET",
    path: "/api/messages",
    label: "List Messages",
    auth: true,
    weight: 8,
  },
  {
    method: "POST",
    path: "/api/messages",
    label: "Send Message",
    auth: true,
    payload: {
      recipientId: "00000000-0000-0000-0000-000000000002",
      subject: "Question about your proposal",
      body: "Hi, I had a question about the timeline you proposed. Could we discuss further?",
    },
    weight: 5,
  },

  // ── Payments ──────────────────────────────────────────────────────
  {
    method: "POST",
    path: "/api/payments/create-intent",
    label: "Create Payment Intent",
    auth: true,
    payload: { amount: 5000, currency: "usd", metadata: { jobId: "job-001" } },
    weight: 3,
  },
  {
    method: "GET",
    path: "/api/payments/history",
    label: "Payment History",
    auth: true,
    weight: 5,
  },

  // ── Reviews ───────────────────────────────────────────────────────
  {
    method: "GET",
    path: "/api/reviews",
    label: "List Reviews",
    weight: 6,
  },
  {
    method: "POST",
    path: "/api/reviews",
    label: "Create Review",
    auth: true,
    payload: {
      targetId: "00000000-0000-0000-0000-000000000003",
      rating: 5,
      comment: "Excellent work, delivered on time and exceeded expectations.",
    },
    weight: 2,
  },

  // ── Notifications ─────────────────────────────────────────────────
  {
    method: "GET",
    path: "/api/notifications",
    label: "List Notifications",
    auth: true,
    weight: 6,
  },
  {
    method: "PUT",
    path: "/api/notifications/read-all",
    label: "Mark All Read",
    auth: true,
    weight: 2,
  },

  // ── Search ────────────────────────────────────────────────────────
  {
    method: "GET",
    path: "/api/search?q=developer&type=jobs&page=1&limit=20",
    label: "Search",
    weight: 8,
  },
  {
    method: "GET",
    path: "/api/search?q=react+node+typescript&type=all&filters[remote]=true",
    label: "Search (Filtered)",
    weight: 5,
  },

  // ── Upload ────────────────────────────────────────────────────────
  {
    method: "POST",
    path: "/api/upload",
    label: "Upload",
    auth: true,
    weight: 2,
    note: "Requires multipart file — skipped in automated bench unless configured",
  },

  // ── Admin ─────────────────────────────────────────────────────────
  {
    method: "GET",
    path: "/api/admin/stats",
    label: "Admin Stats",
    auth: true,
    admin: true,
    weight: 2,
  },
  {
    method: "GET",
    path: "/api/admin/users",
    label: "Admin List Users",
    auth: true,
    admin: true,
    weight: 3,
  },
];

/**
 * Default benchmark profile (moderate load).
 * Override via environment variables or CLI flags.
 */
export const BENCHMARK_PROFILE = {
  // Connection / concurrency
  connections: 10,
  pipelining: 1,

  // Duration (seconds) or number of requests
  duration: 30,
  maxRequests: 0, // 0 = unlimited (runs for duration)

  // Warmup period before collecting metrics
  warmup: 3,

  // Acceptable error rate before the benchmark is flagged
  maxErrorRate: 0.01, // 1%

  // Overall latency thresholds (ms)
  thresholds: {
    p50: 200,
    p95: 800,
    p99: 2000,
  },
};

/**
 * Derived environment defaults.
 * These can be set via .env.benchmark or env vars:
 *   TARGET_HOST=http://localhost
 *   TARGET_PORT=3001
 *   AUTH_TOKEN=<your-bench-token>
 */
export const TARGET = {
  host: process.env.TARGET_HOST || "http://localhost",
  port: process.env.TARGET_PORT || "3001",
  authToken: process.env.AUTH_TOKEN || "",
};

export function baseURL() {
  return `${TARGET.host}:${TARGET.port}`;
}
