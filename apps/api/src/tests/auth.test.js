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

test("POST /api/auth/register rejects missing fullName", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "new-client@example.com",
        password: "password123",
        role: "client"
      })
    });

    assert.equal(response.status, 400);
  });
});

test("POST /api/auth/register rejects admin self-assignment", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "admin-claim@example.com",
        password: "password123",
        fullName: "Admin Claim",
        role: "admin"
      })
    });

    assert.equal(response.status, 400);
  });
});

test("POST /api/auth/register preserves fullName and signs token for returned user", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "freelancer@example.com",
        password: "password123",
        fullName: "Freelancer Example",
        role: "freelancer"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.email, "freelancer@example.com");
    assert.equal(payload.data.fullName, "Freelancer Example");
    assert.equal(payload.data.role, "freelancer");

    const claims = verifyAccessToken(payload.data.token);
    assert.equal(claims.sub, payload.data.id);
    assert.equal(claims.role, "freelancer");
  });
});
