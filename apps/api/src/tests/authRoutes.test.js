import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(app) {
  const server = app.listen(0);

  return new Promise((resolve, reject) => {
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function postJson(baseUrl, path, body) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("login rejects unknown users", async () => {
  const server = await listen(createApp());

  try {
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const response = await postJson(baseUrl, "/api/auth/login", {
      email: `missing-${Date.now()}@example.com`,
      password: "correct-password"
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Invalid email or password" });
  } finally {
    await close(server);
  }
});

test("login verifies registered credentials before minting a token", async () => {
  const server = await listen(createApp());

  try {
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const email = `registered-${Date.now()}@example.com`;
    const password = "correct-password";

    const registerResponse = await postJson(baseUrl, "/api/auth/register", {
      email,
      password,
      role: "client"
    });
    assert.equal(registerResponse.status, 201);

    const wrongPasswordResponse = await postJson(baseUrl, "/api/auth/login", {
      email,
      password: "wrong-password"
    });
    const wrongPasswordPayload = await wrongPasswordResponse.json();

    assert.equal(wrongPasswordResponse.status, 401);
    assert.deepEqual(wrongPasswordPayload, { success: false, message: "Invalid email or password" });

    const loginResponse = await postJson(baseUrl, "/api/auth/login", { email, password });
    const loginPayload = await loginResponse.json();

    assert.equal(loginResponse.status, 200);
    assert.equal(loginPayload.success, true);
    assert.equal(loginPayload.data.email, email);
    assert.match(loginPayload.data.token, /^[\w-]+\.[\w-]+\.[\w-]+$/);
  } finally {
    await close(server);
  }
});
