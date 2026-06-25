import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("GET /api/search returns 400 when query exceeds maximum length", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  const longQuery = "a".repeat(201);
  const res = await fetch(`http://127.0.0.1:${port}/api/search?q=${encodeURIComponent(longQuery)}`);
  assert.equal(res.status, 400, "oversized query must return 400");
  await new Promise((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
});

test("GET /api/search returns 200 for a valid short query", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/search?q=developer`);
  assert.equal(res.status, 200);
  await new Promise((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
});
