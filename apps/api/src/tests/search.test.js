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
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/search trims a valid query", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/search?q=${encodeURIComponent("  hello world  ")}`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.query, "hello world");
  });
});

test("GET /api/search rejects queries longer than 200 characters", async () => {
  await withServer(async (base) => {
    const long = "a".repeat(201);
    const response = await fetch(`${base}/api/search?q=${long}`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /200 characters/);
  });
});

test("GET /api/search accepts a query of exactly 200 characters", async () => {
  await withServer(async (base) => {
    const exact = "b".repeat(200);
    const response = await fetch(`${base}/api/search?q=${exact}`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.query.length, 200);
  });
});

test("GET /api/search rejects repeated q parameters", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/search?q=first&q=second`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /single string/);
  });
});

test("GET /api/search rejects non-string q shapes", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/search?q[foo]=bar`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("GET /api/search strips control characters", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/search?q=${encodeURIComponent("he\u0000llo\u001f")}`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.ok(!/[\u0000-\u001f\u007f]/.test(payload.data.query));
    assert.equal(payload.data.query, "he llo");
  });
});

test("GET /api/search without q returns empty query result", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/search`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.query, "");
  });
});
