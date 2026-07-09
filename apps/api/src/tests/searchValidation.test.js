import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("search query validation", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  await t.test("GET /api/search with valid query", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/search?q=developer`);
    assert.equal(response.status, 200);
  });

  await t.test("GET /api/search with missing query q", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/search`);
    assert.equal(response.status, 400);
  });

  await t.test("GET /api/search with whitespace-only query q", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/search?q=%20%20%20`);
    assert.equal(response.status, 400);
  });

  await t.test("GET /api/search with overly long query q", async () => {
    const longQuery = "a".repeat(201);
    const response = await fetch(`http://127.0.0.1:${port}/api/search?q=${longQuery}`);
    assert.equal(response.status, 400);
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
