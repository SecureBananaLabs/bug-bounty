import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("GET /api/search returns 200 with valid trimmed query", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/search?q=%20react%20developer%20`);
  const payload = await res.json();

  assert.equal(res.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.data.query, "react developer");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET /api/search rejects queries longer than 200 characters with HTTP 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const longQuery = "a".repeat(201);
  const res = await fetch(`http://127.0.0.1:${port}/api/search?q=${longQuery}`);
  const payload = await res.json();

  assert.equal(res.status, 400);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Search query cannot exceed 200 characters");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET /api/search rejects non-string queries (e.g. repeated q params) with HTTP 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/search?q=first&q=second`);
  const payload = await res.json();

  assert.equal(res.status, 400);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Search query must be a string");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET /api/search without query param returns empty query default", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/search`);
  const payload = await res.json();

  assert.equal(res.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.data.query, "");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
