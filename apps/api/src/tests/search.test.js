import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  try {
    return await fn(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function getSearch(port, qs) {
  return fetch(`http://127.0.0.1:${port}/api/search${qs}`);
}

test("GET /api/search accepts a normal query", async () => {
  await withServer(async (port) => {
    const response = await getSearch(port, "?q=designer");
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.equal(payload.data.query, "designer");
  });
});

test("GET /api/search trims whitespace", async () => {
  await withServer(async (port) => {
    const response = await getSearch(port, "?q=%20%20designer%20%20");
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.data.query, "designer");
  });
});

test("GET /api/search rejects empty query", async () => {
  await withServer(async (port) => {
    const response = await getSearch(port, "?q=");
    assert.equal(response.status, 400);
  });
});

test("GET /api/search rejects oversized query", async () => {
  await withServer(async (port) => {
    const huge = "a".repeat(500);
    const response = await getSearch(port, `?q=${huge}`);
    assert.equal(response.status, 400);
  });
});

test("GET /api/search rejects repeated q parameter", async () => {
  await withServer(async (port) => {
    const response = await getSearch(port, "?q=foo&q=bar");
    assert.equal(response.status, 400);
  });
});

test("GET /api/search rejects object-shaped q", async () => {
  await withServer(async (port) => {
    const response = await getSearch(port, "?q%5Ba%5D=foo");
    assert.equal(response.status, 400);
  });
});
