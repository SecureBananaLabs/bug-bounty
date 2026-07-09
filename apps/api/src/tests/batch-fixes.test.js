import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

function createToken(payload) {
  return signAccessToken(payload);
}

async function createTestServer() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  return { server, port };
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

// =============================================
// OAuth callback provider validation (Issue #3852)
// =============================================

test("GET /api/auth/oauth/google/callback returns 200 for supported provider", async () => {
  const { server, port } = await createTestServer();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/auth/oauth/google/callback`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.provider, "google");
  } finally {
    await closeServer(server);
  }
});

test("GET /api/auth/oauth/github/callback returns 200 for supported provider", async () => {
  const { server, port } = await createTestServer();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/auth/oauth/github/callback`);
    assert.equal(res.status, 200);
  } finally {
    await closeServer(server);
  }
});

test("GET /api/auth/oauth/facebook/callback returns 400 for unsupported provider", async () => {
  const { server, port } = await createTestServer();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/auth/oauth/facebook/callback`);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.message.includes("Unsupported"));
  } finally {
    await closeServer(server);
  }
});

test("GET /api/auth/oauth/evil/callback returns 400 for unsupported provider", async () => {
  const { server, port } = await createTestServer();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/auth/oauth/evil/callback`);
    assert.equal(res.status, 400);
  } finally {
    await closeServer(server);
  }
});

// =============================================
// Self-review rejection (Issue #3750)
// =============================================

test("POST /api/reviews rejects self-review with 400", async () => {
  const { server, port } = await createTestServer();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewerId: "usr_123",
        revieweeId: "usr_123",
        rating: 5,
        comment: "Great!",
      }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.message.includes("Self-review"));
  } finally {
    await closeServer(server);
  }
});

test("POST /api/reviews accepts valid review from different users", async () => {
  const { server, port } = await createTestServer();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewerId: "usr_123",
        revieweeId: "usr_456",
        rating: 5,
        comment: "Great work!",
      }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.data.reviewerId, "usr_123");
    assert.equal(body.data.revieweeId, "usr_456");
    assert.ok(body.data.createdAt);
  } finally {
    await closeServer(server);
  }
});

// =============================================
// Registration requires fullName (Issue #3759)
// =============================================

test("POST /api/auth/register rejects missing fullName", async () => {
  const { server, port } = await createTestServer();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });
    assert.equal(res.status, 400);
  } finally {
    await closeServer(server);
  }
});

test("POST /api/auth/register accepts valid payload with fullName", async () => {
  const { server, port } = await createTestServer();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
        fullName: "Test User",
      }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.data.fullName, "Test User");
    assert.ok(body.data.token);
  } finally {
    await closeServer(server);
  }
});

// =============================================
// Password length cap (Issue #3740)
// =============================================

test("POST /api/auth/register rejects password exceeding 128 chars", async () => {
  const { server, port } = await createTestServer();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "a".repeat(129),
        fullName: "Test User",
      }),
    });
    assert.equal(res.status, 400);
  } finally {
    await closeServer(server);
  }
});

test("POST /api/auth/register accepts password at exactly 128 chars", async () => {
  const { server, port } = await createTestServer();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "a".repeat(128),
        fullName: "Test User",
      }),
    });
    assert.equal(res.status, 201);
  } finally {
    await closeServer(server);
  }
});

// =============================================
// Job budget validation - finite numbers (Issue #3748)
// =============================================

test("POST /api/jobs rejects string budget values", async () => {
  const { server, port } = await createTestServer();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test Job",
        description: "A test job description",
        budgetMin: "not-a-number",
        budgetMax: 1000,
        categoryId: "cat_1",
      }),
    });
    assert.equal(res.status, 400);
  } finally {
    await closeServer(server);
  }
});

test("POST /api/jobs rejects negative budget", async () => {
  const { server, port } = await createTestServer();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test Job",
        description: "A test job description",
        budgetMin: -100,
        budgetMax: 1000,
        categoryId: "cat_1",
      }),
    });
    assert.equal(res.status, 400);
  } finally {
    await closeServer(server);
  }
});

test("POST /api/jobs accepts valid finite budget", async () => {
  const { server, port } = await createTestServer();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test Job",
        description: "A test job description that is long enough",
        budgetMin: 100,
        budgetMax: 1000,
        categoryId: "cat_1",
      }),
    });
    assert.equal(res.status, 201);
  } finally {
    await closeServer(server);
  }
});

// =============================================
// Proposal server-assigned createdAt (Issue #3755)
// =============================================

test("POST /api/proposals assigns server createdAt and ignores client value", async () => {
  const { server, port } = await createTestServer();
  try {
    const fakeDate = "2000-01-01T00:00:00.000Z";
    const before = new Date().toISOString();
    const res = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "job_123",
        coverLetter: "I can do this job well and deliver results",
        createdAt: fakeDate,
      }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.notEqual(body.data.createdAt, fakeDate);
    assert.ok(body.data.createdAt >= before);
  } finally {
    await closeServer(server);
  }
});

// =============================================
// Login returns actual role (Issue #3715)
// =============================================

test("POST /api/auth/login returns token matching requested role", async () => {
  const { server, port } = await createTestServer();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "freelancer@example.com",
        password: "password123",
        role: "freelancer",
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.role, "freelancer");
  } finally {
    await closeServer(server);
  }
});

test("POST /api/auth/login defaults to client role when not specified", async () => {
  const { server, port } = await createTestServer();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "user@example.com",
        password: "password123",
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.role, "client");
  } finally {
    await closeServer(server);
  }
});

// =============================================
// Defensive array copies (Issue #3854)
// =============================================

test("mutating returned user list does not affect subsequent calls", async () => {
  const { server, port } = await createTestServer();
  try {
    // Create a user
    await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
        fullName: "Test User",
      }),
    });

    // Get users list
    const res1 = await fetch(`http://127.0.0.1:${port}/api/users`);
    const body1 = await res1.json();
    const count1 = body1.data.length;

    // Mutate the returned array
    body1.data.push({ id: "fake", email: "fake@test.com" });

    // Get users list again - should be same count
    const res2 = await fetch(`http://127.0.0.1:${port}/api/users`);
    const body2 = await res2.json();
    assert.equal(body2.data.length, count1);
  } finally {
    await closeServer(server);
  }
});
