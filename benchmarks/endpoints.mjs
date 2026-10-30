// Synthetic fixtures follow packages/db/prisma/schema.prisma and the API's
// validators. They contain no production data or usable account credentials.
const prose = "Build an accessible project dashboard with a searchable task list, documented API integration, and regression tests. ";
const json = (method, route, body, status = 201) => ({ method, route, body, status });
const get = (route, extra = {}) => ({ method: "GET", route, status: 200, ...extra });

export const endpoints = [
  json("POST", "/api/auth/register", { email: "benchmark@example.test", password: "synthetic-benchmark-only", role: "client" }),
  json("POST", "/api/auth/login", { email: "benchmark@example.test", password: "synthetic-benchmark-only" }, 200),
  get("/api/auth/oauth/:provider/callback", { path: "/api/auth/oauth/github/callback" }),
  json("POST", "/api/auth/refresh", {}, 200),
  json("POST", "/api/users", { email: "benchmark@example.test", passwordHash: "synthetic-fixture", fullName: "Benchmark User", bio: prose.repeat(2), role: "CLIENT" }),
  get("/api/users"),
  json("POST", "/api/jobs", { title: "Build a project dashboard", description: prose.repeat(8), budgetMin: 1000, budgetMax: 2500, categoryId: "cat_benchmark", clientId: "usr_benchmark", skills: ["JavaScript", "API", "Testing"] }),
  get("/api/jobs"),
  json("POST", "/api/proposals", { coverLetter: prose.repeat(5), bidAmount: 1800, estDuration: "2 weeks", jobId: "job_benchmark", freelancerId: "usr_benchmark" }),
  get("/api/proposals"),
  json("POST", "/api/payments", { amount: 1800, currency: "usd", jobId: "job_benchmark" }),
  json("POST", "/api/reviews", { rating: 5, comment: prose.repeat(2), reviewerId: "usr_benchmark", revieweeId: "usr_recipient" }),
  get("/api/reviews"),
  json("POST", "/api/messages", { body: prose.repeat(4), senderId: "usr_benchmark", receiverId: "usr_recipient" }),
  get("/api/messages"),
  json("POST", "/api/notifications", { userId: "usr_benchmark", title: "New proposal", body: prose.repeat(2) }),
  get("/api/notifications"),
  { method: "POST", route: "/api/uploads", status: 201, multipart: true },
  get("/api/search", { path: "/api/search?q=dashboard" }),
  get("/api/admin/metrics", { authenticated: true })
];

export const keyOf = ({ method, route }) => `${method} ${route}`;

export function requestPayload(endpoint) {
  if (endpoint.multipart) {
    const boundary = "benchmark-fixture-boundary";
    return {
      body: Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="benchmark.txt"\r\nContent-Type: text/plain\r\n\r\n${"Synthetic upload fixture.\n".repeat(1024)}\r\n--${boundary}--\r\n`),
      type: `multipart/form-data; boundary=${boundary}`
    };
  }
  return endpoint.body === undefined ? { body: undefined } : {
    body: Buffer.from(JSON.stringify(endpoint.body)), type: "application/json"
  };
}
