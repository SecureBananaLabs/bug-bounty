import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("GET /api/search should return results for valid query", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/search?q=developer`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.ok(payload.data);
  assert.equal(payload.data.query, "developer");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET /api/search should reject queries over 200 characters", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const longQuery = "a".repeat(201);
  const response = await fetch(`http://127.0.0.1:${port}/api/search?q=${longQuery}`);

  assert.equal(response.status, 422, "Should return 422 for query over 200 chars");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET /api/search should handle missing query parameter", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/search`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.ok(payload.data);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
