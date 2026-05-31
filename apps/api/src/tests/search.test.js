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
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/search trims query text before searching", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=%20%20banana%20market%20%20`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.query, "banana market");
  });
});

test("GET /api/search strips control characters from query text", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=%00%09banana%0A`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.query, "banana");
  });
});

test("GET /api/search rejects overly long query text", async () => {
  await withServer(async (baseUrl) => {
    const query = "a".repeat(201);
    const response = await fetch(`${baseUrl}/api/search?q=${query}`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Search query must be 200 characters or fewer"
    });
  });
});

test("GET /api/search rejects overlong raw query text before sanitizing", async () => {
  await withServer(async (baseUrl) => {
    const query = "%00".repeat(201);
    const response = await fetch(`${baseUrl}/api/search?q=${query}`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Search query must be 200 characters or fewer"
    });
  });
});

test("GET /api/search rejects repeated query parameters", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=first&q=second`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Search query must be a single string"
    });
  });
});
