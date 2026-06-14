/**
 * API endpoint targets for benchmarking.
 * Each entry: [method, path, payloadSize, authRequired]
 *
 * Add new endpoints here as they are created.
 * The benchmark runner reads this file to know what to hit.
 */

export const TARGETS = [
  // ── Auth ──────────────────────────────────────────────────────────────
  {
    name: "POST /auth/register",
    method: "POST",
    path: "/api/auth/register",
    payload: { email: "benchmark@example.com", password: "TestPass123!", name: "Bench User" },
    authRequired: false,
    description: "User registration endpoint",
  },
  {
    name: "POST /auth/login",
    method: "POST",
    path: "/api/auth/login",
    payload: { email: "benchmark@example.com", password: "TestPass123!" },
    authRequired: false,
    description: "User login — returns JWT",
  },

  // ── Jobs ────────────────────────────────────────────────────────────────
  {
    name: "GET /jobs",
    method: "GET",
    path: "/api/jobs",
    payload: null,
    authRequired: false,
    description: "List all open jobs",
  },
  {
    name: "GET /jobs/:id",
    method: "GET",
    path: "/api/jobs/1",
    payload: null,
    authRequired: false,
    description: "Get single job details",
  },
  {
    name: "POST /jobs",
    method: "POST",
    path: "/api/jobs",
    payload: {
      title: "Benchmark Test Job",
      description: "Job for load testing purposes",
      budget: 500,
      skills: ["javascript", "nodejs"],
    },
    authRequired: true,
    description: "Create a new job posting",
  },

  // ── Users ─────────────────────────────────────────────────────────────
  {
    name: "GET /users",
    method: "GET",
    path: "/api/users",
    payload: null,
    authRequired: false,
    description: "List all users (paginated)",
  },
  {
    name: "GET /users/:id",
    method: "GET",
    path: "/api/users/1",
    payload: null,
    authRequired: false,
    description: "Get user profile",
  },
  {
    name: "PATCH /users/:id",
    method: "PATCH",
    path: "/api/users/1",
    payload: { name: "Updated Bench User" },
    authRequired: true,
    description: "Update user profile",
  },

  // ── Applications ────────────────────────────────────────────────────
  {
    name: "GET /applications",
    method: "GET",
    path: "/api/applications",
    payload: null,
    authRequired: false,
    description: "List all applications",
  },
  {
    name: "POST /applications",
    method: "POST",
    path: "/api/applications",
    payload: { jobId: 1, coverLetter: "Benchmark application for load testing", proposedRate: 150 },
    authRequired: true,
    description: "Submit a job application",
  },
];

export default TARGETS;
