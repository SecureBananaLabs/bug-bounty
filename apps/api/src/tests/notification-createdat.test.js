import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/notifications returns createdAt timestamp", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "user_123",
      message: "You have a new notification"
    })
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.ok(data.data.createdAt, "Should include createdAt");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/notifications ignores caller-supplied createdAt", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const fakeTimestamp = "2000-01-01T00:00:00.000Z";
  const res = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "user_123",
      message: "Test notification",
      createdAt: fakeTimestamp
    })
  });

  const data = await res.json();
  const actualTs = new Date(data.data.createdAt).getTime();
  const fakeTs = new Date(fakeTimestamp).getTime();

  assert.ok(actualTs > fakeTs, "Server timestamp should be newer than caller-supplied");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
