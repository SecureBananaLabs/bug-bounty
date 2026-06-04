import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

function startServer() {
  const app = createApp();
  const server = app.listen(0);
  return new Promise((resolve) => {
    server.once("listening", () => resolve(server));
  });
}

function baseUrl(server) {
  const { port } = server.address();
  return `http://127.0.0.1:${port}`;
}

function authHeader() {
  const token = signAccessToken({ sub: "usr_test", role: "client" });
  return { Authorization: `Bearer ${token}` };
}

function closeServer(server) {
  return new Promise((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve()))
  );
}

// ─── POST /api/reviews ────────────────────────────────────────

test("POST /api/reviews without auth returns 401", async () => {
  const server = await startServer();
  try {
    const res = await fetch(`${baseUrl(server)}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 5, text: "Great!", jobId: "j1", freelancerId: "f1" }),
    });
    const payload = await res.json();
    assert.equal(res.status, 401);
    assert.equal(payload.success, false);
  } finally {
    await closeServer(server);
  }
});

test("POST /api/reviews with auth but missing required fields returns 400", async () => {
  const server = await startServer();
  try {
    const res = await fetch(`${baseUrl(server)}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({}),
    });
    const payload = await res.json();
    assert.equal(res.status, 400);
    assert.equal(payload.success, false);
  } finally {
    await closeServer(server);
  }
});

test("POST /api/reviews with invalid rating returns 400", async () => {
  const server = await startServer();
  try {
    const res = await fetch(`${baseUrl(server)}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ rating: 10, text: "Good job", jobId: "j1", freelancerId: "f1" }),
    });
    const payload = await res.json();
    assert.equal(res.status, 400);
    assert.equal(payload.success, false);
  } finally {
    await closeServer(server);
  }
});

test("POST /api/reviews with valid payload returns 201", async () => {
  const server = await startServer();
  try {
    const res = await fetch(`${baseUrl(server)}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ rating: 4, text: "Solid work", jobId: "j_123", freelancerId: "f_456" }),
    });
    const payload = await res.json();
    assert.equal(res.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.rating, 4);
    assert.equal(payload.data.jobId, "j_123");
    assert.equal(payload.data.freelancerId, "f_456");
    assert.ok(payload.data.id.startsWith("rev_"));
  } finally {
    await closeServer(server);
  }
});

test("POST /api/reviews rejects string rating (must be integer)", async () => {
  const server = await startServer();
  try {
    const res = await fetch(`${baseUrl(server)}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ rating: "five", text: "Nice", jobId: "j1", freelancerId: "f1" }),
    });
    assert.equal(res.status, 400);
  } finally {
    await closeServer(server);
  }
});

// ─── GET /api/reviews ─────────────────────────────────────────

test("GET /api/reviews returns array (no auth required)", async () => {
  const server = await startServer();
  try {
    const res = await fetch(`${baseUrl(server)}/api/reviews`);
    const payload = await res.json();
    assert.equal(res.status, 200);
    assert.equal(payload.success, true);
    assert.ok(Array.isArray(payload.data));
  } finally {
    await closeServer(server);
  }
});
