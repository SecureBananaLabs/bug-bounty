import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postJson(baseUrl, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });

  return {
    response,
    payload: await response.json()
  };
}

test("POST /api/auth/login rejects unknown credentials", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postJson(baseUrl, "/api/auth/login", {
      email: "missing@example.com",
      password: "password123"
    });

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Invalid credentials" });
  });
});

test("POST /api/auth/login requires the registered password", async () => {
  await withServer(async (baseUrl) => {
    const email = `login-${Date.now()}@example.com`;
    const password = "password123";
    const registerResult = await postJson(baseUrl, "/api/auth/register", {
      email,
      password,
      role: "client"
    });

    assert.equal(registerResult.response.status, 201);

    const wrongPassword = await postJson(baseUrl, "/api/auth/login", {
      email,
      password: "password456"
    });
    assert.equal(wrongPassword.response.status, 401);

    const validLogin = await postJson(baseUrl, "/api/auth/login", {
      email,
      password
    });

    assert.equal(validLogin.response.status, 200);
    assert.equal(validLogin.payload.success, true);
    assert.equal(validLogin.payload.data.email, email);
    assert.equal(typeof validLogin.payload.data.token, "string");
  });
});
