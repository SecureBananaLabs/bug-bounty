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

test("POST /api/jobs rejects inverted budget ranges", async () => {
  const server = await startServer();
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: "Build bounty board",
      description: "Create a small job board for payouts",
      budgetMin: 100,
      budgetMax: 50,
      categoryId: "cat_1",
      skills: ["api"]
    })
  });

  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.match(payload.message, /budgetMin/i);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/jobs accepts valid job payloads", async () => {
  const server = await startServer();
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: "Build bounty board",
      description: "Create a small job board for payouts",
      budgetMin: 50,
      budgetMax: 100,
      categoryId: "cat_1",
      skills: ["api"]
    })
  });

  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.budgetMin, 50);
  assert.equal(payload.data.budgetMax, 100);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
