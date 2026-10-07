import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(cb) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  try {
    await cb(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/search with valid query", async () => {
  await withServer(async (url) => {
    const response = await fetch(`${url}/api/search?q=test`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.query, "test");
  });
});

test("GET /api/search rejects repeated q parameters", async () => {
  await withServer(async (url) => {
    const response = await fetch(`${url}/api/search?q=one&q=two`);
    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.equal(payload.success, false);
  });
});

test("GET /api/search rejects object-shaped q parameters", async () => {
  await withServer(async (url) => {
    const response = await fetch(`${url}/api/search?q[foo]=bar`);
    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.equal(payload.success, false);
  });
});

test("GET /api/search rejects queries longer than 200 characters", async () => {
  await withServer(async (url) => {
    const longQuery = "a".repeat(201);
    const response = await fetch(`${url}/api/search?q=${longQuery}`);
    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.equal(payload.success, false);
  });
});

test("GET /api/search normalizes and trims query", async () => {
  await withServer(async (url) => {
    const response = await fetch(`${url}/api/search?q=%20%20hello%20world%20%20`);
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.data.query, "hello world");
  });
});
