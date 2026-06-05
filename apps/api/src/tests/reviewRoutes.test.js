import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function startServer() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  return { server, port: server.address().port };
}

function stopServer(server) {
  return new Promise((resolve) => server.close(resolve));
}

// ─── POST /api/reviews without auth ──────────────────────────

test("POST /api/reviews returns 401 without auth token", async () => {
  const { server, port } = await startServer();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "job-101",
        freelancerId: "usr_abc",
        rating: 5,
        comment: "Great work!"
      })
    });
    const payload = await res.json();
    assert.equal(res.status, 401);
    assert.equal(payload.success, false);
  } finally {
    await stopServer(server);
  }
});

// ─── POST /api/reviews with invalid token ────────────────────

test("POST /api/reviews returns 401 with invalid token", async () => {
  const { server, port } = await startServer();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalid-token-here"
      },
      body: JSON.stringify({
        jobId: "job-101",
        freelancerId: "usr_abc",
        rating: 5,
        comment: "Great work!"
      })
    });
    const payload = await res.json();
    assert.equal(res.status, 401);
    assert.equal(payload.success, false);
  } finally {
    await stopServer(server);
  }
});

// ─── POST /api/reviews with invalid body (validation) ────────
// NOTE: auth middleware runs before validation, so invalid tokens get 401 first.
// This test verifies the auth gate blocks invalid data from reaching validation.

test("POST /api/reviews blocks invalid review when unauthenticated (401 before validation)", async () => {
  const { server, port } = await startServer();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer fake-valid-looking-token"
      },
      body: JSON.stringify({
        jobId: "job-101",
        // missing freelancerId
        rating: 0, // invalid: below minimum
        comment: "" // empty
      })
    });
    // Auth middleware rejects before body validation runs
    assert.equal(res.status, 401);
    const payload = await res.json();
    assert.equal(payload.success, false);
  } finally {
    await stopServer(server);
  }
});

// ─── GET /api/reviews still works without auth ───────────────

test("GET /api/reviews works without auth (read-only)", async () => {
  const { server, port } = await startServer();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/reviews`);
    const payload = await res.json();
    assert.equal(res.status, 200);
    assert.equal(payload.success, true);
    assert.deepEqual(payload.data, []);
  } finally {
    await stopServer(server);
  }
});
