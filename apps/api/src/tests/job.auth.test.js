import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

/**
 * Tests for issue #1783: Enforce authentication on job creation endpoint
 *
 * These tests verify that the POST /api/jobs endpoint requires a valid
 * JWT token and rejects unauthenticated requests with 401.
 */

const validJobPayload = {
  title: "Build a landing page",
  description: "We need a modern landing page for our SaaS product",
  budgetMin: 500,
  budgetMax: 2000,
  categoryId: "cat_web",
  skills: ["HTML", "CSS", "JavaScript"]
};

test("POST /api/jobs without token returns 401", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validJobPayload)
    });

    assert.equal(response.status, 401, "Unauthenticated job creation should return 401");

    const body = await response.json();
    assert.equal(body.success, false, "Response should indicate failure");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("POST /api/jobs with invalid token returns 401", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

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
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("POST /api/jobs with valid token returns 201 and sets clientId", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    const token = signAccessToken({ sub: "usr_test123", role: "client" });

    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(validJobPayload)
    });

    assert.equal(response.status, 201, "Authenticated job creation should return 201");

    const body = await response.json();
    assert.equal(body.success, true, "Response should indicate success");
    assert.equal(body.data.clientId, "usr_test123", "Job clientId should match authenticated user");
    assert.equal(body.data.title, validJobPayload.title, "Job title should match payload");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("GET /api/jobs remains public (no auth required)", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`);

    assert.equal(response.status, 200, "GET /api/jobs should remain public");

    const body = await response.json();
    assert.equal(body.success, true, "Response should indicate success");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
