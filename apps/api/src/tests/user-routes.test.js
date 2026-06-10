import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

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

async function createUser(baseUrl, token) {
  const headers = { "content-type": "application/json" };
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email: "new@example.com", role: "client" })
  });

  return {
    response,
    payload: await response.json()
  };
}

test("POST /api/users requires authentication", async () => {
  await withServer(async (baseUrl) => {
    const anonymous = await createUser(baseUrl);
    const token = signAccessToken({ sub: "usr_admin", role: "admin" });
    const authenticated = await createUser(baseUrl, token);

    assert.equal(anonymous.response.status, 401);
    assert.equal(anonymous.payload.success, false);
    assert.equal(authenticated.response.status, 201);
    assert.equal(authenticated.payload.success, true);
    assert.equal(authenticated.payload.data.email, "new@example.com");
  });
});
