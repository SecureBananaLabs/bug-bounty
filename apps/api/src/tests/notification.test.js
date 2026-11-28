import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/notifications ignores client-supplied read and id", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  // Attempt to inject client-controlled fields
  const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: "hi", read: true, id: "ntf_evil" }),
  });

  const body = await response.json();
  const notification = body.data;

  assert.equal(response.status, 201);
  // Server must override client-supplied fields
  assert.equal(notification.read, false, "read must be forced to false");
  assert.ok(notification.id.startsWith("ntf_"), "id must be server-generated");
  assert.notEqual(notification.id, "ntf_evil", "id must not be client-controlled");
  assert.equal(notification.content, "hi", "legitimate payload must be preserved");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/notifications defaults read to false when not supplied", async () => {
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
    body: JSON.stringify({ content: "normal" }),
  });

  const body = await response.json();
  assert.equal(response.status, 201);
  assert.equal(body.data.read, false);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
