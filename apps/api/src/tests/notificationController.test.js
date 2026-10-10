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

test("POST /api/notifications returns 400 for invalid payload", async () => {
  const server = await startServer();
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "billing" })
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(payload, {
    success: false,
    message: "Invalid notification payload"
  });

  await stopServer(server);
});

test("POST /api/notifications returns 201 for valid payload", async () => {
  const server = await startServer();
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "usr_1",
      type: "billing",
      message: "Invoice paid"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.userId, "usr_1");
  assert.equal(payload.data.type, "billing");
  assert.equal(payload.data.message, "Invoice paid");
  assert.equal(payload.data.read, false);
  assert.match(payload.data.id, /^ntf_\d+$/);

  await stopServer(server);
});
