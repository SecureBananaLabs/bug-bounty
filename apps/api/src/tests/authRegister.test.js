import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";
import { env } from "../config/env.js";

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

async function postRegister(baseUrl, body) {
  return fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/auth/register defaults public users to client role", async () => {
  await withServer(async (baseUrl) => {
    const response = await postRegister(baseUrl, {
      email: "client@example.com",
      password: "password123"
    });
    const payload = await response.json();
    const decoded = jwt.verify(payload.data.token, env.jwtSecret);

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.role, "client");
    assert.equal(decoded.role, "client");
  });
});

test("POST /api/auth/register allows freelancer role", async () => {
  await withServer(async (baseUrl) => {
    const response = await postRegister(baseUrl, {
      email: "freelancer@example.com",
      password: "password123",
      role: "freelancer"
    });
    const payload = await response.json();
    const decoded = jwt.verify(payload.data.token, env.jwtSecret);

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.role, "freelancer");
    assert.equal(decoded.role, "freelancer");
  });
});

test("POST /api/auth/register rejects admin role assignment", async () => {
  await withServer(async (baseUrl) => {
    const response = await postRegister(baseUrl, {
      email: "admin@example.com",
      password: "password123",
      role: "admin"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
    assert.ok(payload.errors.some((error) => error.path.includes("role")));
  });
});
