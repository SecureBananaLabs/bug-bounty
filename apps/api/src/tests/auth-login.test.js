import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { verifyAccessToken } from "../utils/jwt.js";

async function withServer(run) {
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
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/auth/login rejects unknown credentials", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(baseUrl, "/api/auth/login", {
      email: "missing@example.com",
      password: "Password123"
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid email or password"
    });
  });
});

test("POST /api/auth/login rejects an incorrect password", async () => {
  await withServer(async (baseUrl) => {
    await postJson(baseUrl, "/api/auth/register", {
      email: "wrong-password@example.com",
      password: "Correct123",
      role: "client"
    });

    const response = await postJson(baseUrl, "/api/auth/login", {
      email: "wrong-password@example.com",
      password: "Incorrect123"
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid email or password"
    });
  });
});

test("POST /api/auth/login signs tokens for the registered user", async () => {
  await withServer(async (baseUrl) => {
    const registerResponse = await postJson(baseUrl, "/api/auth/register", {
      email: "freelancer-login@example.com",
      password: "Password123",
      role: "freelancer"
    });
    const registered = await registerResponse.json();

    const loginResponse = await postJson(baseUrl, "/api/auth/login", {
      email: "freelancer-login@example.com",
      password: "Password123"
    });
    const loginPayload = await loginResponse.json();
    const decoded = verifyAccessToken(loginPayload.data.token);

    assert.equal(loginResponse.status, 200);
    assert.equal(loginPayload.success, true);
    assert.equal(loginPayload.data.id, registered.data.id);
    assert.equal(loginPayload.data.role, "freelancer");
    assert.equal(decoded.sub, registered.data.id);
    assert.equal(decoded.role, "freelancer");
  });
});
