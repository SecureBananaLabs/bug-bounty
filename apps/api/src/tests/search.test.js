import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withApiServer(callback) {
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

test("GET /api/search trims and sanitizes the search query", async () => {
  await withApiServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=%20%20hello%00%20%20world%20%20`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.query, "hello world");
  });
});

test("GET /api/search rejects overly long search queries", async () => {
  await withApiServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=${"a".repeat(201)}`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /200 characters or fewer/);
  });
});

test("GET /api/search rejects repeated query parameters", async () => {
  await withApiServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=alpha&q=beta`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Search query must be a string");
  });
});
