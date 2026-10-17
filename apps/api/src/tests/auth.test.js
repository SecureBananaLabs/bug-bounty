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

  try {
    const { port } = server.address();
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

test("POST /api/auth/login rejects unregistered credentials", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(baseUrl, "/api/auth/login", {
      email: "missing@example.com",
      password: "password123"
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid email or password"
    });
  });
});

test("POST /api/auth/login rejects a wrong password for a registered user", async () => {
  await withServer(async (baseUrl) => {
    await postJson(baseUrl, "/api/auth/register", {
      email: "wrong-password@example.com",
      password: "correct-password",
      role: "client"
    });

    const response = await postJson(baseUrl, "/api/auth/login", {
      email: "wrong-password@example.com",
      password: "incorrect-password"
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid email or password"
    });
  });
});

test("POST /api/auth/login signs tokens for the registered user id", async () => {
  await withServer(async (baseUrl) => {
    const registerResponse = await postJson(baseUrl, "/api/auth/register", {
      email: "login-success@example.com",
      password: "correct-password",
      role: "freelancer"
    });
    const registered = await registerResponse.json();

    const loginResponse = await postJson(baseUrl, "/api/auth/login", {
      email: "LOGIN-SUCCESS@example.com",
      password: "correct-password"
    });
    const loggedIn = await loginResponse.json();
    const decoded = verifyAccessToken(loggedIn.data.token);

    assert.equal(loginResponse.status, 200);
    assert.equal(loggedIn.data.email, "login-success@example.com");
    assert.equal(decoded.sub, registered.data.id);
    assert.equal(decoded.role, "freelancer");
  });
});
