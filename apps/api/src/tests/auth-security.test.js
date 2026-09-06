import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(assertions) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/auth/register rejects admin role self-assignment", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin-attempt@example.com",
        password: "password123",
        role: "admin"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/auth/refresh requires and validates a submitted token", async () => {
  await withServer(async (baseUrl) => {
    const missingResponse = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });

    assert.equal(missingResponse.status, 400);

    const validToken = signAccessToken({ sub: "usr_refresh", role: "client" });
    const validResponse = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: validToken })
    });
    const payload = await validResponse.json();

    assert.equal(validResponse.status, 200);
    assert.equal(payload.success, true);
    assert.equal(typeof payload.data.token, "string");
  });
});

test("admin metrics requires an admin token", async () => {
  await withServer(async (baseUrl) => {
    const clientToken = signAccessToken({ sub: "usr_client", role: "client" });
    const clientResponse = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });

    assert.equal(clientResponse.status, 403);

    const adminToken = signAccessToken({ sub: "usr_admin", role: "admin" });
    const adminResponse = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.equal(adminResponse.status, 200);
  });
});

test("sensitive write routes require authentication", async () => {
  await withServer(async (baseUrl) => {
    const routes = [
      ["/api/jobs", { title: "Test job", description: "Test job description", budgetMin: 1, budgetMax: 2, categoryId: "cat_test" }],
      ["/api/proposals", { jobId: "job_test", freelancerId: "usr_test", coverLetter: "Test", bid: 1 }],
      ["/api/payments", { amount: 100, currency: "usd" }],
      ["/api/reviews", { reviewerId: "usr_a", revieweeId: "usr_b", rating: 5 }],
      ["/api/messages", { senderId: "usr_a", recipientId: "usr_b", message: "hello" }],
      ["/api/notifications", { userId: "usr_a", type: "test", message: "hello" }]
    ];

    for (const [path, body] of routes) {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      assert.equal(response.status, 401, `${path} should reject anonymous writes`);
    }
  });
});
