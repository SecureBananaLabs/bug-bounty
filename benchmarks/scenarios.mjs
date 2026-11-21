import { Buffer } from "node:buffer";

const description = "Synthetic benchmark data for a local development API. ".repeat(20);
const jsonHeaders = { "Content-Type": "application/json" };
const boundary = "freelanceflow-benchmark-upload-boundary";
const uploadBody = Buffer.concat([
  Buffer.from(
    `--${boundary}\r\n` +
      'Content-Disposition: form-data; name="file"; filename="benchmark.txt"\r\n' +
      "Content-Type: text/plain\r\n\r\n"
  ),
  Buffer.alloc(16 * 1024, "x"),
  Buffer.from(`\r\n--${boundary}--\r\n`)
]);

// Each scenario is run against a fresh fixture. GET responses therefore always
// start with the same 20 seeded rows, regardless of the number of POST requests.
export const scenarios = [
  {
    id: "POST /api/auth/register",
    method: "POST",
    path: "/api/auth/register",
    expectedStatus: 201,
    headers: jsonHeaders,
    body: {
      email: "benchmark.register@example.invalid",
      password: "Benchmark-Only-Password-2026",
      role: "client"
    }
  },
  {
    id: "POST /api/auth/login",
    method: "POST",
    path: "/api/auth/login",
    expectedStatus: 200,
    headers: jsonHeaders,
    body: {
      email: "benchmark.user.0@example.invalid",
      password: "Benchmark-Only-Password-2026"
    }
  },
  {
    id: "GET /api/auth/oauth/:provider/callback",
    method: "GET",
    path: "/api/auth/oauth/benchmark/callback",
    expectedStatus: 200
  },
  {
    id: "POST /api/auth/refresh",
    method: "POST",
    path: "/api/auth/refresh",
    expectedStatus: 200,
    headers: jsonHeaders,
    body: {}
  },
  { id: "GET /api/users", method: "GET", path: "/api/users", expectedStatus: 200 },
  {
    id: "POST /api/users",
    method: "POST",
    path: "/api/users",
    expectedStatus: 201,
    headers: jsonHeaders,
    body: {
      email: "benchmark.created@example.invalid",
      fullName: "Synthetic Benchmark User",
      passwordHash: "benchmark-placeholder-not-a-real-password-hash",
      role: "CLIENT",
      bio: description
    }
  },
  { id: "GET /api/jobs", method: "GET", path: "/api/jobs", expectedStatus: 200 },
  {
    id: "POST /api/jobs",
    method: "POST",
    path: "/api/jobs",
    expectedStatus: 201,
    headers: jsonHeaders,
    body: {
      title: "Synthetic benchmark job",
      description,
      budgetMin: 100,
      budgetMax: 200,
      categoryId: "benchmark-category",
      skills: ["javascript", "testing"]
    }
  },
  { id: "GET /api/proposals", method: "GET", path: "/api/proposals", expectedStatus: 200 },
  {
    id: "POST /api/proposals",
    method: "POST",
    path: "/api/proposals",
    expectedStatus: 201,
    headers: jsonHeaders,
    body: {
      jobId: "benchmark-job-0",
      freelancerId: "benchmark-user-1",
      coverLetter: description,
      bidAmount: 150,
      estDuration: "2 weeks"
    }
  },
  {
    id: "POST /api/payments",
    method: "POST",
    path: "/api/payments",
    expectedStatus: 201,
    headers: jsonHeaders,
    body: { amount: 150, currency: "usd", jobId: "benchmark-job-0" }
  },
  { id: "GET /api/reviews", method: "GET", path: "/api/reviews", expectedStatus: 200 },
  {
    id: "POST /api/reviews",
    method: "POST",
    path: "/api/reviews",
    expectedStatus: 201,
    headers: jsonHeaders,
    body: {
      rating: 5,
      comment: description,
      reviewerId: "benchmark-user",
      revieweeId: "benchmark-user-1"
    }
  },
  { id: "GET /api/messages", method: "GET", path: "/api/messages", expectedStatus: 200 },
  {
    id: "POST /api/messages",
    method: "POST",
    path: "/api/messages",
    expectedStatus: 201,
    headers: jsonHeaders,
    body: {
      body: description,
      senderId: "benchmark-user",
      receiverId: "benchmark-user-1",
      isRead: false
    }
  },
  { id: "GET /api/notifications", method: "GET", path: "/api/notifications", expectedStatus: 200 },
  {
    id: "POST /api/notifications",
    method: "POST",
    path: "/api/notifications",
    expectedStatus: 201,
    headers: jsonHeaders,
    body: {
      userId: "benchmark-user",
      title: "Synthetic benchmark notification",
      body: description,
      read: false
    }
  },
  {
    id: "POST /api/uploads",
    method: "POST",
    path: "/api/uploads",
    expectedStatus: 201,
    headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
    body: uploadBody
  },
  { id: "GET /api/search", method: "GET", path: "/api/search?q=benchmark", expectedStatus: 200 },
  {
    id: "GET /api/admin/metrics",
    method: "GET",
    path: "/api/admin/metrics",
    expectedStatus: 200,
    authenticated: true
  }
];
