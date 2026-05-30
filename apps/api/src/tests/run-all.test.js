import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";
import { ok, fail } from "../utils/response.js";
import { registerUser, loginUser, refreshToken } from "../services/authService.js";
import { listJobs, createJob } from "../services/jobService.js";
import { listUsers, createUser } from "../services/userService.js";
import { listMessages, sendMessage } from "../services/messageService.js";
import { listNotifications, createNotification } from "../services/notificationService.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { listProposals, createProposal } from "../services/proposalService.js";
import { listReviews, createReview } from "../services/reviewService.js";
import { globalSearch } from "../services/searchService.js";
import { getAdminMetrics } from "../services/adminService.js";
import { registerSchema, loginSchema } from "../validators/auth.js";
import { createJobSchema } from "../validators/job.js";

let server, baseUrl, authToken;

test.before(async () => {
  const app = createApp();
  server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
  authToken = signAccessToken({ sub: "usr_admin_test", role: "admin" });
});

test.after(() => {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

// ═══════════════════════════════════════════════════════════════════
// E2E TESTS
// ═══════════════════════════════════════════════════════════════════

// ── Health ────────────────────────────────────────────────────────
test("GET /health returns ok payload", async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body, { ok: true, service: "api" });
});

test("GET /nonexistent returns 404", async () => {
  const res = await fetch(`${baseUrl}/nonexistent`);
  assert.equal(res.status, 404);
});

// ── Auth ──────────────────────────────────────────────────────────
test("POST /api/auth/register creates a user with token", async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "tester@example.com", password: "password123", role: "client" })
  });
  assert.equal(res.status, 201);
  const { success, data } = await res.json();
  assert.equal(success, true);
  assert.ok(data.token);
  assert.equal(data.email, "tester@example.com");
  assert.equal(data.role, "client");
});

test("POST /api/auth/login returns token", async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "user@example.com", password: "password123" })
  });
  assert.equal(res.status, 200);
  const { success, data } = await res.json();
  assert.equal(success, true);
  assert.ok(data.token);
});

test("POST /api/auth/refresh returns new token", async () => {
  const res = await fetch(`${baseUrl}/api/auth/refresh`, { method: "POST" });
  assert.equal(res.status, 200);
  const { data } = await res.json();
  assert.ok(data.token);
});

test("GET /api/auth/oauth/github/callback returns provider info", async () => {
  const res = await fetch(`${baseUrl}/api/auth/oauth/github/callback`);
  const { data } = await res.json();
  assert.equal(data.provider, "github");
  assert.equal(data.status, "callback-received");
});

// ── Jobs ──────────────────────────────────────────────────────────
test("GET /api/jobs returns array", async () => {
  const res = await fetch(`${baseUrl}/api/jobs`);
  assert.equal(res.status, 200);
  const { data } = await res.json();
  assert.ok(Array.isArray(data));
});

test("POST /api/jobs creates a job with defaults", async () => {
  const res = await fetch(`${baseUrl}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Build a React app",
      description: "Need a full React app with TypeScript and modern tooling",
      budgetMin: 500,
      budgetMax: 2000,
      categoryId: "web-dev",
      skills: ["react", "typescript"]
    })
  });
  assert.equal(res.status, 201);
  const { data } = await res.json();
  assert.ok(data.id);
  assert.equal(data.status, "open");
  assert.deepEqual(data.skills, ["react", "typescript"]);
});

// ── Users ─────────────────────────────────────────────────────────
test("GET /api/users returns array", async () => {
  const res = await fetch(`${baseUrl}/api/users`);
  const { data } = await res.json();
  assert.ok(Array.isArray(data));
});

test("POST /api/users creates a user", async () => {
  const res = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Test User", email: "tu@example.com" })
  });
  assert.equal(res.status, 201);
  const { data } = await res.json();
  assert.ok(data.id);
  assert.equal(data.name, "Test User");
});

// ── Messages ──────────────────────────────────────────────────────
test("GET /api/messages returns array", async () => {
  const res = await fetch(`${baseUrl}/api/messages`);
  const { data } = await res.json();
  assert.ok(Array.isArray(data));
});

test("POST /api/messages sends a message", async () => {
  const res = await fetch(`${baseUrl}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from: "usr_1", to: "usr_2", body: "Hi there" })
  });
  assert.equal(res.status, 201);
  const { data } = await res.json();
  assert.ok(data.id);
  assert.ok(data.sentAt);
  assert.equal(data.body, "Hi there");
});

// ── Notifications ─────────────────────────────────────────────────
test("GET /api/notifications returns array", async () => {
  const res = await fetch(`${baseUrl}/api/notifications`);
  const { data } = await res.json();
  assert.ok(Array.isArray(data));
});

test("POST /api/notifications creates unread notification", async () => {
  const res = await fetch(`${baseUrl}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: "usr_1", type: "info", message: "Approved!" })
  });
  assert.equal(res.status, 201);
  const { data } = await res.json();
  assert.equal(data.read, false);
  assert.equal(data.type, "info");
});

// ── Payments ──────────────────────────────────────────────────────
test("POST /api/payments creates a payment intent", async () => {
  const res = await fetch(`${baseUrl}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 5000, currency: "usd" })
  });
  assert.equal(res.status, 201);
  const { data } = await res.json();
  assert.ok(data.paymentId);
  assert.equal(data.amount, 5000);
  assert.equal(data.provider, "stripe");
});

// ── Proposals ─────────────────────────────────────────────────────
test("GET /api/proposals returns array", async () => {
  const res = await fetch(`${baseUrl}/api/proposals`);
  const { data } = await res.json();
  assert.ok(Array.isArray(data));
});

test("POST /api/proposals creates a proposal", async () => {
  const res = await fetch(`${baseUrl}/api/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId: "job_1", freelancerId: "usr_1", coverLetter: "5 years exp", bidAmount: 1200 })
  });
  assert.equal(res.status, 201);
  const { data } = await res.json();
  assert.ok(data.id);
  assert.equal(data.bidAmount, 1200);
});

// ── Reviews ───────────────────────────────────────────────────────
test("GET /api/reviews returns array", async () => {
  const res = await fetch(`${baseUrl}/api/reviews`);
  const { data } = await res.json();
  assert.ok(Array.isArray(data));
});

test("POST /api/reviews creates a review", async () => {
  const res = await fetch(`${baseUrl}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reviewerId: "usr_1", revieweeId: "usr_2", rating: 5, comment: "Great work" })
  });
  assert.equal(res.status, 201);
  const { data } = await res.json();
  assert.ok(data.id);
  assert.equal(data.rating, 5);
});

// ── Search ────────────────────────────────────────────────────────
test("GET /api/search?q=react returns results", async () => {
  const res = await fetch(`${baseUrl}/api/search?q=react`);
  assert.equal(res.status, 200);
  const { data } = await res.json();
  assert.equal(data.query, "react");
  assert.ok(Array.isArray(data.users));
  assert.ok(Array.isArray(data.jobs));
  assert.ok(Array.isArray(data.freelancers));
});

test("GET /api/search without q defaults to empty", async () => {
  const res = await fetch(`${baseUrl}/api/search`);
  const { data } = await res.json();
  assert.equal(data.query, "");
});

// ── Admin (protected) ─────────────────────────────────────────────
test("GET /api/admin/metrics requires auth", async () => {
  const res = await fetch(`${baseUrl}/api/admin/metrics`);
  assert.equal(res.status, 401);
});

test("GET /api/admin/metrics returns metrics with valid token", async () => {
  const res = await fetch(`${baseUrl}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert.equal(res.status, 200);
  const { data } = await res.json();
  assert.equal(typeof data.openJobs, "number");
  assert.equal(typeof data.activeFreelancers, "number");
  assert.equal(typeof data.flaggedAccounts, "number");
  assert.equal(typeof data.monthlyVolume, "number");
});

test("GET /api/admin/metrics rejects bad token", async () => {
  const res = await fetch(`${baseUrl}/api/admin/metrics`, {
    headers: { Authorization: "Bearer invalid-token" }
  });
  assert.equal(res.status, 401);
});

// ═══════════════════════════════════════════════════════════════════
// UNIT TESTS
// ═══════════════════════════════════════════════════════════════════

// ── AuthService ───────────────────────────────────────────────────
test("authService.registerUser returns id, email, role, token", async () => {
  const result = await registerUser({ email: "unit@test.com", password: "password123", role: "freelancer" });
  assert.ok(result.id.startsWith("usr_"));
  assert.equal(result.email, "unit@test.com");
  assert.equal(result.role, "freelancer");
  assert.ok(result.token);
});

test("authService.loginUser returns email and token", async () => {
  const result = await loginUser({ email: "unit@test.com", password: "password123" });
  assert.equal(result.email, "unit@test.com");
  assert.ok(result.token);
});

test("authService.refreshToken returns token", async () => {
  const result = await refreshToken();
  assert.ok(result.token);
});

// ── JobService ────────────────────────────────────────────────────
test("jobService.listJobs returns array", async () => {
  const jobs = await listJobs();
  assert.ok(Array.isArray(jobs));
});

test("jobService.createJob returns job with status open", async () => {
  const job = await createJob({
    title: "Unit test job",
    description: "A job created during unit testing phase",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "testing"
  });
  assert.ok(job.id.startsWith("job_"));
  assert.equal(job.status, "open");
});

// ── UserService ───────────────────────────────────────────────────
test("userService.createUser returns user with id", async () => {
  const user = await createUser({ name: "Unit User", email: "uu@test.com" });
  assert.ok(user.id.startsWith("usr_"));
  assert.equal(user.name, "Unit User");
});

// ── MessageService ────────────────────────────────────────────────
test("messageService.sendMessage adds sentAt timestamp", async () => {
  const msg = await sendMessage({ from: "a", to: "b", body: "hello" });
  assert.ok(msg.id.startsWith("msg_"));
  assert.ok(msg.sentAt);
});

// ── NotificationService ───────────────────────────────────────────
test("notificationService.createNotification starts unread", async () => {
  const ntf = await createNotification({ type: "alert", message: "test" });
  assert.equal(ntf.read, false);
  assert.ok(ntf.id.startsWith("ntf_"));
});

// ── PaymentService ────────────────────────────────────────────────
test("paymentService.createPaymentIntent defaults currency to usd", async () => {
  const pay = await createPaymentIntent({ amount: 1000 });
  assert.equal(pay.currency, "usd");
  assert.equal(pay.provider, "stripe");
});

// ── ProposalService ───────────────────────────────────────────────
test("proposalService.createProposal returns with id", async () => {
  const p = await createProposal({ jobId: "j1", bidAmount: 300 });
  assert.ok(p.id.startsWith("prp_"));
});

// ── ReviewService ─────────────────────────────────────────────────
test("reviewService.createReview stores rating", async () => {
  const r = await createReview({ rating: 4, comment: "Solid" });
  assert.ok(r.id.startsWith("rev_"));
  assert.equal(r.rating, 4);
});

// ── SearchService ─────────────────────────────────────────────────
test("searchService.globalSearch returns query and arrays", async () => {
  const s = await globalSearch("test");
  assert.equal(s.query, "test");
  assert.ok(Array.isArray(s.users));
});

// ── AdminService ──────────────────────────────────────────────────
test("adminService.getAdminMetrics returns numeric dashboard", async () => {
  const m = await getAdminMetrics();
  assert.ok(m.openJobs >= 0);
  assert.ok(m.activeFreelancers >= 0);
  assert.ok(m.flaggedAccounts >= 0);
  assert.ok(m.monthlyVolume >= 0);
});

// ── JWT Utils ─────────────────────────────────────────────────────
test("jwt sign+verify round-trip preserves payload", () => {
  const token = signAccessToken({ sub: "usr_test", role: "admin" });
  const decoded = verifyAccessToken(token);
  assert.equal(decoded.sub, "usr_test");
  assert.equal(decoded.role, "admin");
});

test("jwt verifyAccessToken throws on garbage input", () => {
  assert.throws(() => verifyAccessToken("garbage.token.here"));
});

// ── Response Utils ────────────────────────────────────────────────
function mockRes() {
  const r = { statusCode: 200, body: null, status(c) { r.statusCode = c; return r; }, json(d) { r.body = d; return r; } };
  return r;
}

test("response ok() wraps data in success envelope", () => {
  const r = mockRes();
  ok(r, { x: 1 });
  assert.equal(r.statusCode, 200);
  assert.deepEqual(r.body, { success: true, data: { x: 1 } });
});

test("response ok() supports 201 status", () => {
  const r = mockRes();
  ok(r, { id: 1 }, 201);
  assert.equal(r.statusCode, 201);
});

test("response fail() returns error envelope", () => {
  const r = mockRes();
  fail(r, "Bad input", 400);
  assert.equal(r.statusCode, 400);
  assert.deepEqual(r.body, { success: false, message: "Bad input" });
});

// ── Validators ────────────────────────────────────────────────────
test("registerSchema accepts valid payload and defaults role", () => {
  const r = registerSchema.parse({ email: "v@test.com", password: "longpassword" });
  assert.equal(r.role, "client");
});

test("registerSchema rejects bad email", () => {
  assert.throws(() => registerSchema.parse({ email: "bad", password: "longpassword" }));
});

test("registerSchema rejects short password", () => {
  assert.throws(() => registerSchema.parse({ email: "a@b.com", password: "abc" }));
});

test("registerSchema rejects invalid role", () => {
  assert.throws(() => registerSchema.parse({ email: "a@b.com", password: "longpassword", role: "superadmin" }));
});

test("loginSchema rejects missing password", () => {
  assert.throws(() => loginSchema.parse({ email: "a@b.com" }));
});

test("createJobSchema accepts valid job and defaults skills to []", () => {
  const j = createJobSchema.parse({
    title: "Test Title",
    description: "A decent description here",
    budgetMin: 0,
    budgetMax: 100,
    categoryId: "cat1"
  });
  assert.deepEqual(j.skills, []);
});

test("createJobSchema rejects negative budgetMin", () => {
  assert.throws(() =>
    createJobSchema.parse({
      title: "Test Title", description: "A decent description here",
      budgetMin: -50, budgetMax: 100, categoryId: "cat1"
    })
  );
});

test("createJobSchema rejects short description", () => {
  assert.throws(() =>
    createJobSchema.parse({
      title: "Test Title", description: "tiny",
      budgetMin: 0, budgetMax: 100, categoryId: "cat1"
    })
  );
});

test("createJobSchema rejects short title", () => {
  assert.throws(() =>
    createJobSchema.parse({
      title: "Hi", description: "A decent description here",
      budgetMin: 0, budgetMax: 100, categoryId: "cat1"
    })
  );
});
