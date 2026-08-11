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

  return server;
}

async function stopServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/messages returns 401 when request is unauthenticated", async () => {
  const server = await startServer();
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: "unauthenticated message" })
  });
  const payload = await response.json();

  assert.equal(response.status, 401);
  assert.deepEqual(payload, { success: false, message: "Unauthorized" });

  await stopServer(server);
});

test("POST /api/messages succeeds with valid bearer token", async () => {
  const server = await startServer();
  const { port } = server.address();
  const token = signAccessToken({ sub: "user_123", role: "user" });

  const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({ text: "authenticated message" })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.text, "authenticated message");
  assert.equal(typeof payload.data.id, "string");
  assert.equal(typeof payload.data.sentAt, "string");

  await stopServer(server);
});
