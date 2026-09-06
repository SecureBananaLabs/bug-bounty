import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/notifications should not allow client to override read state", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Test notification", read: true, id: "malicious_id" })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.data.read, false, "Server should force read to false");
  assert.ok(payload.data.id.startsWith("ntf_"), "Server should generate its own id");
  assert.notEqual(payload.data.id, "malicious_id", "Client should not be able to override id");
  assert.equal(payload.data.message, "Test notification");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/notifications should not allow client to override id", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Another test", id: "custom_id_123" })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.ok(payload.data.id.startsWith("ntf_"), "Server should always generate its own id");
  assert.equal(payload.data.message, "Another test");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
