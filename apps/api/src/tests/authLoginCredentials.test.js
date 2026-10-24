import test from "node:test";
import assert from "node:assert/strict";
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
    return await callback(`http://127.0.0.1:${port}`);
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

test("POST /api/auth/login rejects unknown and wrong credentials", async () => {
  await withServer(async (baseUrl) => {
    const email = `client-${Date.now()}@example.com`;
    const password = "correct-password";

    await postJson(baseUrl, "/api/auth/register", {
      email,
      password,
      role: "client"
    });

    const unknown = await postJson(baseUrl, "/api/auth/login", {
      email: `unknown-${Date.now()}@example.com`,
      password
    });
    const wrongPassword = await postJson(baseUrl, "/api/auth/login", {
      email,
      password: "wrong-password"
    });

    assert.equal(unknown.status, 401);
    assert.deepEqual(await unknown.json(), { success: false, message: "Invalid credentials" });

    assert.equal(wrongPassword.status, 401);
    assert.deepEqual(await wrongPassword.json(), { success: false, message: "Invalid credentials" });
  });
});

test("POST /api/auth/login accepts matching registered credentials", async () => {
  await withServer(async (baseUrl) => {
    const email = `client-${Date.now()}@example.com`;
    const password = "correct-password";

    await postJson(baseUrl, "/api/auth/register", {
      email,
      password,
      role: "freelancer"
    });

    const response = await postJson(baseUrl, "/api/auth/login", {
      email,
      password
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.email, email);
    assert.equal(typeof payload.data.token, "string");
    assert.ok(payload.data.token.length > 0);
  });
});
