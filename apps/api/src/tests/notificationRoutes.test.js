import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/notifications requires userId, title, and body", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  
  // Missing userId
  let response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Hi", body: "Hello" }),
  });
  let payload = await response.json();
  assert.equal(response.status, 400);
  assert.equal(payload.success, false);

  // Blank body
  response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: "u1", title: "Hi", body: "   " }),
  });
  payload = await response.json();
  assert.equal(response.status, 400);
  assert.equal(payload.success, false);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/notifications preserves server-generated id and read state", async () => {
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
    body: JSON.stringify({ userId: "u1", title: "Hi", body: "Hello", id: "malicious_id", read: true }),
  });
  const payload = await response.json();
  
  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.ok(payload.data.id.startsWith("ntf_"));
  assert.notEqual(payload.data.id, "malicious_id");
  assert.equal(payload.data.read, false);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
