import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { verifyAccessToken } from "../utils/jwt.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postJson(url, body) {
  return fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/auth/register requires fullName", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/api/auth/register`, {
      email: "missing-name@example.com",
      password: "password123",
      role: "client"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/auth/register rejects admin self-assignment", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/api/auth/register`, {
      fullName: "Admin Attempt",
      email: "admin-attempt@example.com",
      password: "password123",
      role: "admin"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/auth/register preserves fullName and token subject", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(`${baseUrl}/api/auth/register`, {
      fullName: "Freelance Builder",
      email: "builder@example.com",
      password: "password123",
      role: "freelancer"
    });
    const payload = await response.json();
    const decoded = verifyAccessToken(payload.data.token);

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.fullName, "Freelance Builder");
    assert.equal(payload.data.email, "builder@example.com");
    assert.equal(payload.data.role, "freelancer");
    assert.equal(decoded.sub, payload.data.id);
    assert.equal(decoded.role, "freelancer");
  });
});
