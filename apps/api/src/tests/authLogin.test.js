import assert from "node:assert/strict";
import test from "node:test";

import { createApp } from "../app.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
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

test("login rejects unknown users and wrong passwords", async () => {
  await withServer(async (baseUrl) => {
    const email = `auth-${Date.now()}@example.com`;

    const unknownLogin = await postJson(baseUrl, "/api/auth/login", {
      email,
      password: "validpass123"
    });
    const unknownPayload = await unknownLogin.json();

    assert.equal(unknownLogin.status, 401);
    assert.deepEqual(unknownPayload, {
      success: false,
      message: "Invalid email or password"
    });

    const register = await postJson(baseUrl, "/api/auth/register", {
      email,
      password: "validpass123",
      role: "client"
    });

    assert.equal(register.status, 201);

    const wrongPassword = await postJson(baseUrl, "/api/auth/login", {
      email,
      password: "wrongpass123"
    });

    assert.equal(wrongPassword.status, 401);

    const validLogin = await postJson(baseUrl, "/api/auth/login", {
      email,
      password: "validpass123"
    });
    const validPayload = await validLogin.json();

    assert.equal(validLogin.status, 200);
    assert.equal(validPayload.success, true);
    assert.equal(validPayload.data.email, email);
    assert.equal(typeof validPayload.data.token, "string");
  });
});
