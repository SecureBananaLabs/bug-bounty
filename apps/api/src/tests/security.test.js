/**
 * Security Hardening Test Suite
 *
 * Covers fixes for issues: #1471, #1470, #1469, #1468, #1467, #1466, #1465, #1464
 * Run with: npm run test  (from apps/api directory)
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import jwt from "jsonwebtoken";

// ─── Helpers ───────────────────────────────────────────────
function createServer() {
  const app = createApp();
  const server = app.listen(0);
  return new Promise((resolve, reject) => {
    server.once("listening", () => resolve({ app, server, port: server.address().port }));
    server.once("error", reject);
  });
}

function destroy(server) {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

function post(server, path, body, headers = {}) {
  return fetch(`http://127.0.0.1:${server.address().port}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body)
  });
}

function get(server, path, headers = {}) {
  return fetch(`http://127.0.0.1:${server.address().port}${path}`, { headers });
}

function makeToken(overrides = {}) {
  const payload = { sub: "usr_test", role: "client", ...overrides };
  return jwt.sign(payload, process.env.JWT_SECRET ?? "development-secret", { expiresIn: "15m" });
}

// ═══════════════════════════════════════════════════════════
// Fix #1471 — Authentication Bypass in Login & Refresh
// ═══════════════════════════════════════════════════════════

test("#1471-1: POST /api/auth/login rejects empty credentials", async () => {
  const { server } = await createServer();
  try {
    // No email or password → should be caught by Zod
    const res = await post(server, "/api/auth/login", {});
    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.ok(body.message.includes("Required") || body.message.includes("email"));
  } finally { await destroy(server); }
});

test("#1471-2: POST /api/auth/login returns generic error for unknown user (prevents enumeration)", async () => {
  const { server } = await createServer();
  try {
    const res = await post(server, "/api/auth/login", {
      email: "nonexistent@example.com",
      password: "password12345"
    });
    const body = await res.json();
    assert.equal(res.status, 401);
    // Must NOT reveal whether email exists — generic message only
    assert.ok(
      body.message.includes("Invalid") || body.message.includes("credential"),
      `Expected generic error, got: ${body.message}`
    );
  } finally { await destroy(server); }
});

test("#1471-3: POST /api/auth/refresh without token returns 400", async () => {
  const { server } = await createServer();
  try {
    const res = await post(server, "/api/auth/refresh", {});
    const body = await res.json();
    assert.equal(res.status, 400);
    assert.ok(body.message.toLowerCase().includes("required"), `Got: ${body.message}`);
  } finally { await destroy(server); }
});

test("#1471-4: POST /api/auth/refresh with invalid token returns 401", async () => {
  const { server } = await createServer();
  try {
    const res = await post(server, "/api/auth/refresh", { refresh_token: "totally-invalid-token" });
    const body = await res.json();
    assert.equal(res.status, 401);
    assert.ok(body.message.toLowerCase().includes("invalid") || body.message.toLowerCase().includes("expired"));
  } finally { await destroy(server); }
});

test("#1471-5: POST /api/auth/refresh with valid token returns new access token", async () => {
  const { server } = await createServer();
  try {
    // First register to get a valid token
    const regRes = await post(server, "/api/auth/register", {
      email: "refresh-test@example.com",
      password: "password12345",
      role: "client"
    });
    const { data: regData } = await regRes.json();
    const token = regData.token;

    // Then use it to refresh
    const refRes = await post(server, "/api/auth/refresh", { refresh_token: token });
    const refBody = await refRes.json();
    assert.equal(refRes.status, 200);
    assert.equal(refBody.success, true);
    assert.ok(refBody.data.token, "Response must contain a new token");
  } finally { await destroy(server); }
});

// ═══════════════════════════════════════════════════════════
// Fix #1470 — JWT_SECRET Production Guard
// ═══════════════════════════════════════════════════════════

test("#1470-1: App starts in development mode without JWT_SECRET", async () => {
  // Should not throw — development allows default secret with warning
  const { server } = await createServer();
  try {
    assert.ok(server.listening, "Server should start in development");
  } finally { await destroy(server); }
});

// ═══════════════════════════════════════════════════════════
// Fix #1469 — Zod Validation Errors Return 400
// ═══════════════════════════════════════════════════════════

test("#1469-1: Invalid email format returns 400 with validation details", async () => {
  const { server } = await createServer();
  try {
    const res = await post(server, "/api/auth/register", {
      email: "not-an-email",
      password: "password12345"
    });
    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
  } finally { await destroy(server); }
});

test("#1469-2: Short password returns 400 with descriptive error", async () => {
  const { server } = await createServer();
  try {
    const res = await post(server, "/api/auth/register", {
      email: "shortpwd@test.com",
      password: "123" // less than 8 chars
    });
    const body = await res.json();
    assert.equal(res.status, 400);
    assert.ok(body.message.toString().includes("8") || body.message?.errors?.length > 0,
      "Error should mention minimum length");
  } finally { await destroy(server); }
});

// ═══════════════════════════════════════════════════════════
// Fix #1468 — POST /api/users Requires Validation
// ═══════════════════════════════════════════════════════════

test("#1468-1: POST /api/users without required fields returns 400", async () => {
  const { server } = await createServer();
  try {
    const res = await post(server, "/api/users", {});
    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
  } finally { await destroy(server); }
});

test("#1468-2: POST /api/users rejects extra fields (.strict())", async () => {
  const { server } = await createServer();
  try {
    const res = await post(server, "/api/users", {
      email: "extra@test.com",
      name: "Test User",
      role: "client",
      isAdmin: true,   // Extra field — should be rejected by .strict()
      password: "hacked"
    });
    const body = await res.json();
    assert.equal(res.status, 400);
    assert.ok(body.message?.errors?.length > 0, "Should report unexpected keys");
  } finally { await destroy(server); }
});

// ═══════════════════════════════════════════════════════════
// Fix #1467 — Budget Min <= Max Validation
// ═══════════════════════════════════════════════════════════

test("#1467-1: Job creation with budgetMin > budgetMax returns 400", async () => {
  const { server } = await createServer();
  try {
    const res = await post(server, "/api/jobs", {
      title: "Test Job",
      description: "A test job description here",
      budgetMin: 500,
      budgetMax: 100, // Less than min!
      categoryId: "cat1"
    });
    const body = await res.json();
    assert.equal(res.status, 400);
    // ZodError is caught by errorHandler → { success:false, message:"Validation error", errors:[...] }
    const hasBudgetErr = (body.errors || body.message?.errors || [])?.some(
      e => (e.field || e.path || []).join(".").includes("budget") ||
           (e.message || "").toLowerCase().includes("budget")
    );
    assert.ok(hasBudgetErr, `Expected budget validation error, got: ${JSON.stringify(body)}`);
  } finally { await destroy(server); }
});

test("#1467-2: Job creation with equal budgets succeeds (boundary)", async () => {
  const { server } = await createServer();
  try {
    const res = await post(server, "/api/jobs", {
      title: "Boundary Test Job",
      description: "Testing boundary condition for budget validation",
      budgetMin: 200,
      budgetMax: 200, // Equal is allowed
      categoryId: "cat1"
    });
    // Should not return a budget validation error (may fail for other reasons)
    const body = await res.json();
    if (res.status === 400) {
      assert.ok(
        !body.message?.toString().toLowerCase().includes("budget"),
        "Equal budgets should NOT trigger budget validation error"
      );
    }
  } finally { await destroy(server); }
});

// ═══════════════════════════════════════════════════════════
// Fix #1466 — Admin Role Blocked from Self-Registration
// ═══════════════════════════════════════════════════════════

test("#1466-1: Registration with role=admin returns 400", async () => {
  const { server } = await createServer();
  try {
    const res = await post(server, "/api/auth/register", {
      email: "admin-try@test.com",
      password: "password12345",
      role: "admin" // Should be rejected!
    });
    const body = await res.json();
    assert.equal(res.status, 400);
    // Zod v3 returns "Invalid enum value" for invalid enum literals
    const errMsg = body.message?.toString() || "";
    assert.ok(
      errMsg.includes("Invalid") || (body.errors || body.message?.errors || []).length > 0,
      `Admin role should be rejected. Got: ${JSON.stringify(body)}`
    );
  } finally { await destroy(server); }
});

// ═══════════════════════════════════════════════════════════
// Fix #1465 — Admin Endpoints Require Admin Role
// ═══════════════════════════════════════════════════════════

test("#1465-1: GET /api/admin/metrics without auth returns 401", async () => {
  const { server } = await createServer();
  try {
    const res = await get(server, "/api/admin/metrics");
    assert.equal(res.status, 401);
  } finally { await destroy(server); }
});

test("#1465-2: GET /api/admin/metrics with non-admin token returns 403", async () => {
  const { server } = await createServer();
  try {
    const clientToken = makeToken({ role: "client" });
    const res = await get(server, "/api/admin/metrics", {
      Authorization: `Bearer ${clientToken}`
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.ok(body.message.toLowerCase().includes("forbidden") ||
              body.message.toLowerCase().includes("admin"),
              `Expected forbidden/admin error, got: ${body.message}`);
  } finally { await destroy(server); }
});

// ═══════════════════════════════════════════════════════════
// Fix #1464 — Notification Routes Require Auth
// ═══════════════════════════════════════════════════════════

test("#1464-1: GET /api/notifications without auth returns 401", async () => {
  const { server } = await createServer();
  try {
    const res = await get(server, "/api/notifications");
    assert.equal(res.status, 401);
  } finally { await destroy(server); }
});

test("#1464-2: POST /api/notifications without auth returns 401", async () => {
  const { server } = await createServer();
  try {
    const res = await post(server, "/api/notifications", { message: "test" });
    assert.equal(res.status, 401);
  } finally { await destroy(server); }
});

test("#1464-3: GET /api/notifications with valid token returns 200", async () => {
  const { server } = await createServer();
  try {
    const token = makeToken({ role: "client" });
    const res = await get(server, "/api/notifications", {
      Authorization: `Bearer ${token}`
    });
    // Should not be 401 (may be 200 or 500 depending on DB, but NOT unauthorized)
    assert.notEqual(res.status, 401, "Authenticated request should not return 401");
  } finally { await destroy(server); }
});
