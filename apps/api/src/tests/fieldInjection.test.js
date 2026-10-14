import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/messages ignores client-controlled id and sentAt", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: "hello",
      id: "msg_INJECTED",
      sentAt: "2099-01-01T00:00:00Z"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.ok(payload.data.id.startsWith("msg_"));
  assert.notEqual(payload.data.id, "msg_INJECTED");
  assert.notEqual(payload.data.sentAt, "2099-01-01T00:00:00Z");
  assert.equal(payload.data.content, "hello");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/jobs ignores client-controlled id and status", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "test job",
      description: "test description here",
      budgetMin: 100,
      budgetMax: 500,
      categoryId: "cat_123",
      id: "job_INJECTED",
      status: "closed"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.ok(payload.data.id.startsWith("job_"));
  assert.notEqual(payload.data.id, "job_INJECTED");
  assert.equal(payload.data.status, "open");
  assert.equal(payload.data.title, "test job");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
