import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

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

test("POST /api/users returns 400 for invalid payload", async () => {
  const server = await startServer();
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "not-an-email" })
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(payload, {
    success: false,
    message: "Invalid user payload"
  });

  await stopServer(server);
});

test("POST /api/users returns 201 for valid payload", async () => {
  const server = await startServer();
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Evelyn",
      email: "evelyn@example.com"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.fullName, "Evelyn");
  assert.equal(payload.data.email, "evelyn@example.com");
  assert.equal(payload.data.role, "client");
  assert.match(payload.data.id, /^usr_\d+$/);

  await stopServer(server);
});
