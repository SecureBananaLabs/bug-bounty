import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { verifyAccessToken } from "../utils/jwt.js";

async function withTestServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postJson(baseUrl, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = await response.json();

  return { response, payload };
}

test("login rejects unregistered credentials", async () => {
  await withTestServer(async (baseUrl) => {
    const { response, payload } = await postJson(baseUrl, "/api/auth/login", {
      email: "missing@example.com",
      password: "password123"
    });

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
  });
});

test("login rejects a registered user with the wrong password", async () => {
  await withTestServer(async (baseUrl) => {
    const email = `wrong-password-${Date.now()}@example.com`;
    await postJson(baseUrl, "/api/auth/register", {
      email,
      password: "password123",
      role: "freelancer"
    });

    const { response, payload } = await postJson(baseUrl, "/api/auth/login", {
      email,
      password: "password456"
    });

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
  });
});

test("login signs tokens for the registered user's id and role", async () => {
  await withTestServer(async (baseUrl) => {
    const email = `valid-login-${Date.now()}@example.com`;
    const password = "password123";
    const role = "freelancer";
    const registration = await postJson(baseUrl, "/api/auth/register", {
      email,
      password,
      role
    });

    const { response, payload } = await postJson(baseUrl, "/api/auth/login", {
      email,
      password
    });
    const claims = verifyAccessToken(payload.data.token);

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(claims.sub, registration.payload.data.id);
    assert.equal(claims.role, role);
  });
});
