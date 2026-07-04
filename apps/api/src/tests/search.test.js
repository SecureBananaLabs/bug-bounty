import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("Search Validation & Query Length Limit", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  t.after(() => {
    server.close();
  });

  await t.test("GET /api/search rejects missing query parameter", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/search`);
    assert.equal(response.status, 400);
    const data = await response.json();
    assert.equal(data.success, false);
  });

  await t.test("GET /api/search rejects blank query parameter", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/search?q=%20%20`);
    assert.equal(response.status, 400);
    const data = await response.json();
    assert.equal(data.success, false);
  });

  await t.test("GET /api/search rejects query parameter longer than 200 characters", async () => {
    const longQuery = "a".repeat(201);
    const response = await fetch(`http://127.0.0.1:${port}/api/search?q=${longQuery}`);
    assert.equal(response.status, 400);
    const data = await response.json();
    assert.equal(data.success, false);
    assert.match(data.error, /exceeds maximum length/);
  });

  await t.test("GET /api/search accepts query parameter <= 200 characters", async () => {
    const validQuery = "a".repeat(200);
    const response = await fetch(`http://127.0.0.1:${port}/api/search?q=${validQuery}`);
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.success, true);
  });
});
