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
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await fn(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/search with no parameters returns 200 and default pagination", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/search`);
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data.query, "");
    assert.equal(data.data.page, 1);
    assert.equal(data.data.limit, 10);
    assert.ok(Array.isArray(data.data.users));
    assert.ok(Array.isArray(data.data.jobs));
    assert.ok(Array.isArray(data.data.freelancers));
  });
});

test("GET /api/search with valid query, page and limit returns 200 and matches input", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/search?q=developer&page=2&limit=25`);
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data.query, "developer");
    assert.equal(data.data.page, 2);
    assert.equal(data.data.limit, 25);
  });
});

test("GET /api/search with excessively long query (> 100 chars) rejects with 400 Bad Request", async () => {
  await withServer(async (baseUrl) => {
    const longQuery = "a".repeat(101);
    const res = await fetch(`${baseUrl}/api/search?q=${longQuery}`);
    const data = await res.json();

    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.match(data.message, /not exceed 100 characters/i);
  });
});

test("GET /api/search with invalid page (< 1) rejects with 400 Bad Request", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/search?page=0`);
    const data = await res.json();

    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.match(data.message, /Page must be greater than or equal to 1/i);
  });
});

test("GET /api/search with excessive limit (> 50) rejects with 400 Bad Request", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/search?limit=51`);
    const data = await res.json();

    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.match(data.message, /Limit must not exceed 50/i);
  });
});

test("GET /api/search strips control characters and trims whitespace safely", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/search?q=%20hello%00world%20`);
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.data.query, "helloworld");
  });
});
