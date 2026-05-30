import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("search flow integration tests", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await t.test("GET /api/search with query exceeding 200 characters returns 400", async () => {
    const longQuery = "a".repeat(201);
    const response = await fetch(`${baseUrl}/api/search?q=${longQuery}`);
    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Search query must not exceed 200 characters");
  });

  await t.test("GET /api/search with standard query succeeds", async () => {
    const response = await fetch(`${baseUrl}/api/search?q=developer`);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.equal(payload.data.query, "developer");
  });

  await t.test("GET /api/search with HTML tags inside the query sanitizes it properly", async () => {
    const queryWithHtml = "<h1>hello</h1><script>alert(1)</script>world";
    const response = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent(queryWithHtml)}`);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.equal(payload.data.query, "helloalert(1)world");
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
