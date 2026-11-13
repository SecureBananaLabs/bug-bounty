// Synthetic fixtures follow Prisma fields and the API's Zod validators.
const user = { email: "benchmark@example.invalid", fullName: "Benchmark User", role: "client" };
const credentials = { email: user.email, password: "benchmark-only-password" };
const job = { title: "Build a marketplace dashboard", description: "Implement an accessible dashboard with job filters and pagination. ".repeat(16), budgetMin: 500, budgetMax: 1500, categoryId: "benchmark-category", clientId: "benchmark-client", skills: ["JavaScript", "React"] };
const pair = (path, body) => [{ method: "GET", path, status: 200 }, { method: "POST", path, body, status: 201 }];
export const cases = [
  { method: "POST", path: "/api/auth/register", body: { ...credentials, role: "client" }, status: 201 },
  { method: "POST", path: "/api/auth/login", body: credentials, status: 200 },
  { method: "GET", path: "/api/auth/oauth/github/callback", status: 200 },
  { method: "POST", path: "/api/auth/refresh", body: {}, status: 200 },
  ...pair("/api/users", user), ...pair("/api/jobs", job),
  ...pair("/api/proposals", { jobId: "benchmark-job", freelancerId: "benchmark-worker", coverLetter: "I can implement and test the dashboard. ".repeat(16), bidAmount: 1000, estDuration: "2 weeks" }),
  { method: "POST", path: "/api/payments", body: { jobId: "benchmark-job", amount: 1000, currency: "usd" }, status: 201 },
  ...pair("/api/reviews", { rating: 5, comment: "Delivered the requested dashboard with tests.", reviewerId: "benchmark-client", revieweeId: "benchmark-worker" }),
  ...pair("/api/messages", { senderId: "benchmark-client", receiverId: "benchmark-worker", body: "Please review the attached dashboard requirements. ".repeat(20) }),
  ...pair("/api/notifications", { userId: "benchmark-client", title: "New proposal", body: "A freelancer submitted a proposal for your dashboard." }),
  { method: "POST", path: "/api/uploads", upload: true, status: 201 },
  { method: "GET", path: "/api/search?q=dashboard", status: 200 },
  { method: "GET", path: "/api/admin/metrics", auth: true, status: 200 }
];
export const key = c => `${c.method} ${c.path}`;
export function payload(c) {
  if (c.upload) {
    const boundary = "benchmark-boundary";
    return { type: `multipart/form-data; boundary=${boundary}`, data: Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="brief.txt"\r\nContent-Type: text/plain\r\n\r\n${"Dashboard brief. ".repeat(1024)}\r\n--${boundary}--\r\n`) };
  }
  return c.body ? { type: "application/json", data: Buffer.from(JSON.stringify(c.body)) } : { data: Buffer.alloc(0) };
}
