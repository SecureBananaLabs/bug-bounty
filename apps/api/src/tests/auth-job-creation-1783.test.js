import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

/**
 * Tests for issue #1783: Enforce authentication on job creation endpoint
 *
 * The POST /api/jobs endpoint should:
 * 1. Return 401 when no Authorization header is provided
 * 2. Return 401 when an invalid token is provided
 * 3. Allow job creation with a valid token (authenticated users only)
 * 4. GET /api/jobs should remain public (no auth required)
 */

const validJobPayload = {
  title: "Build a web application",
  description: "We need a full-stack web application built from scratch",
  budgetMin: 1000,
  budgetMax: 5000,
  categoryId: "cat_webdev",
  skills: ["javascript", "react"]
};

function listen(app) {
  const server = app.listen(0);
  return new Promise((resolve, reject) => {
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

test("POST /api/jobs without auth token returns 401", async () => {
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validJobPayload)
    });

    assert.equal(response.status, 401, "Unauthenticated POST should return 401");
    const body = await response.json();
    assert.equal(body.success, false, "Response should indicate failure");
  } finally {
    await close(server);
  }
});

test("POST /api/jobs with invalid token returns 401", async () => {
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer invalid-token-here"
      },
      body: JSON.stringify(validJobPayload)
    });

    assert.equal(response.status, 401, "Invalid token should return 401");
    const body = await response.json();
    assert.equal(body.success, false, "Response should indicate failure");
  } finally {
    await close(server);
  }
});

test("GET /api/jobs remains public (no auth required)", async () => {
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`);

    assert.equal(response.status, 200, "GET /api/jobs should be public");
    const body = await response.json();
    assert.equal(body.success, true, "Response should indicate success");
  } finally {
    await close(server);
  }
});

test("POST /api/jobs with valid token succeeds", async () => {
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();

  const token = signAccessToken({ sub: "usr_test123", role: "client" });

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(validJobPayload)
    });

    assert.equal(response.status, 201, "Authenticated POST should succeed");
    const body = await response.json();
    assert.equal(body.success, true, "Response should indicate success");
  } finally {
    await close(server);
  }
});
