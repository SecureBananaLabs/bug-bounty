import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(app, fn) {
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  try {
    return await fn(server);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/auth/register returns user id matching JWT sub claim", async () => {
  const app = createApp();
  await withServer(app, async (server) => {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
        role: "freelancer"
      })
    });
    const payload = await response.json();
    assert.equal(response.status, 201);
    assert.ok(payload.success);
    assert.ok(payload.data.id);
    assert.ok(payload.data.token);
    // Decode the JWT payload (base64url) without verifying signature
    const tokenBody = JSON.parse(
      Buffer.from(payload.data.token.split(".")[1], "base64url").toString()
    );
    assert.equal(tokenBody.sub, payload.data.id,
      "JWT sub claim must match the user id returned in the response body"
    );
  });
});

test("POST /api/auth/register with invalid email returns 400", async () => {
  const app = createApp();
  await withServer(app, async (server) => {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "not-an-email",
        password: "password123"
      })
    });
    assert.equal(response.status, 400);
  });
});
