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

async function searchQuery(path) {
  return withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}${path}`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    return payload.data.query;
  });
}

test("GET /api/search preserves normal string query values", async () => {
  assert.equal(await searchQuery("/api/search?q=alpha"), "alpha");
});

test("GET /api/search uses the first repeated q string value", async () => {
  assert.equal(await searchQuery("/api/search?q=alpha&q=beta"), "alpha");
});

test("GET /api/search falls back for nested q values", async () => {
  assert.equal(await searchQuery("/api/search?q[x]=beta"), "");
});

test("GET /api/search treats missing q as an empty string", async () => {
  assert.equal(await searchQuery("/api/search"), "");
});
