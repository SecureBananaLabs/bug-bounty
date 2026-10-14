import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/search trims a valid query before searching", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=%20freelance%20`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.query, "freelance");
  });
});

test("GET /api/search preserves the empty-query fallback", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.query, "");
  });
});

test("GET /api/search rejects queries over 200 characters", async () => {
  await withServer(async (baseUrl) => {
    const longQuery = "a".repeat(201);
    const response = await fetch(`${baseUrl}/api/search?q=${longQuery}`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid search query");
  });
});

test("GET /api/search rejects repeated query parameters", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=one&q=two`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid search query");
  });
});
