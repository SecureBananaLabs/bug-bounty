import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { MAX_SEARCH_QUERY_LENGTH } from "../validators/search.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/search normalizes query input", async () => {
  await withServer(async (port) => {
    const query = encodeURIComponent(" \u0000  hello world \u001F ");
    const response = await fetch(`http://127.0.0.1:${port}/api/search?q=${query}`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.query, "hello world");
  });
});

test("GET /api/search rejects overlong query input", async () => {
  await withServer(async (port) => {
    const tooLong = "a".repeat(MAX_SEARCH_QUERY_LENGTH + 1);
    const response = await fetch(`http://127.0.0.1:${port}/api/search?q=${tooLong}`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /at most/i);
  });
});

test("GET /api/search rejects object-like query input", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/search?q[key]=value`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /must be a string/i);
  });
});
