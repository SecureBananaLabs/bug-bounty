import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/search trims a valid query", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=%20designer%20`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.query, "designer");
  });
});

test("GET /api/search rejects repeated q parameters", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=one&q=two`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid search query" });
  });
});

test("GET /api/search rejects object-shaped q parameters", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q[name]=designer`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid search query" });
  });
});

test("GET /api/search rejects oversized q parameters", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=${"a".repeat(201)}`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Invalid search query" });
  });
});
