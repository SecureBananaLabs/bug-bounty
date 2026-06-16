import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST with oversized JSON payload gets rejected with 413", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  
  // Create a payload larger than 1MB (1.1 MB of 'a's)
  const largeString = "a".repeat(1.1 * 1024 * 1024);
  const payload = JSON.stringify({ data: largeString });

  const response = await fetch(`http://127.0.0.1:${port}/api/nonexistent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload,
  });

  assert.equal(response.status, 413);

  const body = await response.json();
  assert.equal(body.success, false);
  assert.match(body.message, /too large/i);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST with normal JSON payload under 1MB does not get 413", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  
  // Create a payload under 1MB
  const payload = JSON.stringify({ username: "testuser", password: "password123" });

  const response = await fetch(`http://127.0.0.1:${port}/api/nonexistent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload,
  });

  // Since /api/nonexistent does not exist, it should return 404 (not 413)
  assert.equal(response.status, 404);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
