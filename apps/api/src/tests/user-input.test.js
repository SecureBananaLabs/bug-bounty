import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function startServer() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    }),
  };
}

test("POST /api/users with empty payload is rejected (400)", async () => {
  const server = await startServer();
  try {
    const token = signAccessToken({ id: "user-1" });
    const response = await fetch(`${server.baseUrl}/api/users`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    assert.equal(response.status, 400);
  } finally {
    await server.close();
  }
});

test("POST /api/users client-supplied id is ignored (server id used)", async () => {
  const server = await startServer();
  try {
    const token = signAccessToken({ id: "user-1" });
    const response = await fetch(`${server.baseUrl}/api/users`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: "usr_malicious", email: "alice@example.com" }),
    });
    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.ok(payload.data.id.startsWith("usr_"));
    assert.notEqual(payload.data.id, "usr_malicious");
    assert.equal(payload.data.email, "alice@example.com");
  } finally {
    await server.close();
  }
});
