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

test("POST /api/users does not echo sensitive credential fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: "secret-create@example.com",
        password: "password123",
        passwordHash: "hash",
        accessToken: "access",
        refreshToken: "refresh"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.email, "secret-create@example.com");
    assert.equal(payload.data.password, undefined);
    assert.equal(payload.data.passwordHash, undefined);
    assert.equal(payload.data.accessToken, undefined);
    assert.equal(payload.data.refreshToken, undefined);
  });
});

test("GET /api/users omits sensitive credential fields from stored users", async () => {
  await withServer(async (baseUrl) => {
    await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: "secret-list@example.com",
        password: "password123",
        token: "session-token"
      })
    });

    const response = await fetch(`${baseUrl}/api/users`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);

    const user = payload.data.find((entry) => entry.email === "secret-list@example.com");
    assert.ok(user);
    assert.equal(user.password, undefined);
    assert.equal(user.token, undefined);
  });
});
