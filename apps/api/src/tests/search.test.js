import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function makeRequest(path) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}${path}`);
    const data = await res.json();
    return { status: res.status, data };
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/search?q=developer returns 200", async () => {
  const { status, data } = await makeRequest("/api/search?q=developer");
  assert.equal(status, 200);
  assert.equal(data.success, true);
  assert.equal(data.data.query, "developer");
  assert.equal(data.data.page, 1);
  assert.equal(data.data.limit, 10);
});

test("GET /api/search (missing q) returns 400", async () => {
  const { status, data } = await makeRequest("/api/search");
  assert.equal(status, 400);
  assert.equal(data.success, false);
  assert.equal(data.message, "Validation failed");
  assert.ok(Array.isArray(data.errors));
});

test("GET /api/search?q= (empty q) returns 400", async () => {
  const { status, data } = await makeRequest("/api/search?q=");
  assert.equal(status, 400);
  assert.equal(data.success, false);
  assert.equal(data.message, "Validation failed");
  assert.ok(Array.isArray(data.errors));
});

test("GET /api/search?q=... (>200 chars) returns 400", async () => {
  const longQuery = "a".repeat(201);
  const { status, data } = await makeRequest(`/api/search?q=${longQuery}`);
  assert.equal(status, 400);
  assert.equal(data.success, false);
  assert.equal(data.message, "Validation failed");
  assert.ok(Array.isArray(data.errors));
});

test("GET /api/search?q=test&limit=999 returns 400", async () => {
  const { status, data } = await makeRequest("/api/search?q=test&limit=999");
  assert.equal(status, 400);
  assert.equal(data.success, false);
  assert.equal(data.message, "Validation failed");
  assert.ok(Array.isArray(data.errors));
});

test("GET /api/search?q=test&page=0 returns 400", async () => {
  const { status, data } = await makeRequest("/api/search?q=test&page=0");
  assert.equal(status, 400);
  assert.equal(data.success, false);
  assert.equal(data.message, "Validation failed");
  assert.ok(Array.isArray(data.errors));
});
