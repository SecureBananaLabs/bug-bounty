import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { SEARCH_QUERY_MAX_LENGTH } from "../validators/search.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    return await fn(server.address().port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("search trims the query before matching", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/search?q=%20%20designer%20`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.query, "designer");
  });
});

test("search accepts a missing query as an empty string", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/search`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.query, "");
  });
});

test("search rejects a query longer than the limit", async () => {
  await withServer(async (port) => {
    const query = "a".repeat(SEARCH_QUERY_MAX_LENGTH + 1);
    const response = await fetch(
      `http://127.0.0.1:${port}/api/search?q=${encodeURIComponent(query)}`
    );
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "q must be a string of at most 200 characters");
  });
});

test("search accepts a query at the exact limit", async () => {
  await withServer(async (port) => {
    const query = "b".repeat(SEARCH_QUERY_MAX_LENGTH);
    const response = await fetch(
      `http://127.0.0.1:${port}/api/search?q=${encodeURIComponent(query)}`
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.query.length, SEARCH_QUERY_MAX_LENGTH);
  });
});
