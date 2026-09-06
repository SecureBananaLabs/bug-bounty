import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("Search Route: GET /api/search input normalization and validation", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/search`;

  try {
    // 1. Normal query
    const resp1 = await fetch(`${baseUrl}?q=  banana  `);
    assert.equal(resp1.status, 200);
    const payload1 = await resp1.json();
    assert.equal(payload1.data.query, "banana"); // must be trimmed

    // 2. Omitted/empty query
    const resp2 = await fetch(baseUrl);
    assert.equal(resp2.status, 200);
    const payload2 = await resp2.json();
    assert.equal(payload2.data.query, "");

    // 3. Non-string query coercion (number)
    const resp3 = await fetch(`${baseUrl}?q=12345`);
    assert.equal(resp3.status, 200);
    const payload3 = await resp3.json();
    assert.equal(payload3.data.query, "12345");

    // 4. Overly long query (101 characters)
    const longQuery = "a".repeat(101);
    const resp4 = await fetch(`${baseUrl}?q=${longQuery}`);
    assert.equal(resp4.status, 400);
    const payload4 = await resp4.json();
    assert.equal(payload4.success, false);
    assert.equal(payload4.message, "Query parameter is too long");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
