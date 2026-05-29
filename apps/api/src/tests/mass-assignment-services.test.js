import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function startServer(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0);
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/notifications strips unknown fields", async () => {
  const app = createApp();
  const server = await startServer(app);
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Test notification",
      type: "info",
      userId: "usr_123",
      adminOverride: true,
      systemLevel: "critical",
      injected: "evil",
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 201);
  assert.ok(data.ok);
  assert.equal(data.data.message, "Test notification");
  assert.equal(data.data.adminOverride, undefined);
  assert.equal(data.data.systemLevel, undefined);
  assert.equal(data.data.injected, undefined);

  await closeServer(server);
});

test("POST /api/messages strips unknown fields", async () => {
  const app = createApp();
  const server = await startServer(app);
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: "usr_456",
      from: "usr_123",
      content: "Hello!",
      isAdmin: true,
      priority: "urgent",
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 201);
  assert.ok(data.ok);
  assert.equal(data.data.to, "usr_456");
  assert.equal(data.data.isAdmin, undefined);
  assert.equal(data.data.priority, undefined);

  await closeServer(server);
});

test("POST /api/reviews strips unknown fields", async () => {
  const app = createApp();
  const server = await startServer(app);
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rating: 5,
      comment: "Great work!",
      jobId: "job_789",
      reviewerId: "usr_123",
      featured: true,
      adminApproved: true,
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 201);
  assert.ok(data.ok);
  assert.equal(data.data.rating, 5);
  assert.equal(data.data.featured, undefined);
  assert.equal(data.data.adminApproved, undefined);

  await closeServer(server);
});
