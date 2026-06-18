import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("GET /api/search input validation", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));

  await t.test("rejects query string longer than 200 characters", async () => {
    const longQuery = "a".repeat(201);
    const response = await fetch(`${baseUrl}/api/search?q=${longQuery}`);
    assert.equal(response.status, 400);
  });

  await t.test("rejects array of query parameters", async () => {
    const response = await fetch(`${baseUrl}/api/search?q=test&q=another`);
    assert.equal(response.status, 400);
  });

  await t.test("accepts valid query string", async () => {
    const response = await fetch(`${baseUrl}/api/search?q=developer`);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.ok(payload.success);
  });

  await t.test("accepts empty query string and falls back to default", async () => {
    const response = await fetch(`${baseUrl}/api/search`);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.ok(payload.success);
  });
});
