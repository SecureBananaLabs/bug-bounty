import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("Search API Flow", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await t.test("GET /api/search with valid query returns 200", async () => {
    const response = await fetch(`${baseUrl}/api/search?q=test`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.query, "test");
  });

  await t.test("GET /api/search with missing query returns 400", async () => {
    const response = await fetch(`${baseUrl}/api/search`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.ok(payload.message.toLowerCase().includes("blank") || payload.message.toLowerCase().includes("required"));
  });

  await t.test("GET /api/search with empty query string returns 400", async () => {
    const response = await fetch(`${baseUrl}/api/search?q=`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.ok(payload.message.toLowerCase().includes("blank") || payload.message.toLowerCase().includes("required"));
  });

  await t.test("GET /api/search with blank query string (whitespace) returns 400", async () => {
    const response = await fetch(`${baseUrl}/api/search?q=%20%20%20`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.ok(payload.message.toLowerCase().includes("blank") || payload.message.toLowerCase().includes("required"));
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
