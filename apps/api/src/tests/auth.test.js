import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postJson(baseUrl, path, body) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/auth/register rejects admin self-assignment", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(baseUrl, "/api/auth/register", {
      email: "admin@example.com",
      password: "password123",
      role: "admin"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid registration payload");
  });
});

test("POST /api/auth/register defaults new users to client role", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(baseUrl, "/api/auth/register", {
      email: "client@example.com",
      password: "password123"
    });
    const payload = await response.json();
    const claims = jwt.decode(payload.data.token);

    assert.equal(response.status, 201);
    assert.equal(payload.data.role, "client");
    assert.equal(claims.role, "client");
  });
});

test("POST /api/auth/register allows freelancer role", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(baseUrl, "/api/auth/register", {
      email: "freelancer@example.com",
      password: "password123",
      role: "freelancer"
    });
    const payload = await response.json();
    const claims = jwt.decode(payload.data.token);

    assert.equal(response.status, 201);
    assert.equal(payload.data.role, "freelancer");
    assert.equal(claims.role, "freelancer");
  });
});
