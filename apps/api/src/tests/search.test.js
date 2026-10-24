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

test("Valid search query returns 200 and paginated payload", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/search?q=fullstack&page=1&limit=10`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.query, "fullstack");
    assert.equal(body.data.page, 1);
    assert.equal(body.data.limit, 10);
  });
});

test("Search query exceeding 200 chars returns 400", async () => {
  await withServer(async (baseUrl) => {
    const longQuery = "a".repeat(201);
    const res = await fetch(`${baseUrl}/api/search?q=${longQuery}`);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });
});

test("Empty search query returns 400", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/search?q=`);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });
});

test("Search query with limit exceeding 50 returns 400", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/search?q=developer&limit=100`);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });
});
