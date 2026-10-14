import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/reviews requires reviewerId, targetId, rating, and comment", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  
  // Test missing targetId
  let response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reviewerId: "u1", rating: 5, comment: "Great" }),
  });
  let payload = await response.json();
  assert.equal(response.status, 400);
  assert.equal(payload.success, false);

  // Test invalid rating
  response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reviewerId: "u1", targetId: "u2", rating: 6, comment: "Great" }),
  });
  payload = await response.json();
  assert.equal(response.status, 400);
  assert.equal(payload.success, false);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/reviews preserves server-generated id", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  
  const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reviewerId: "u1", targetId: "u2", rating: 5, comment: "Great", id: "malicious_id" }),
  });
  const payload = await response.json();
  
  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.ok(payload.data.id.startsWith("rev_"));
  assert.notEqual(payload.data.id, "malicious_id");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
