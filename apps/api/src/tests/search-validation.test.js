import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(assertions) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
  try { await assertions(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
}

test("GET /api/search rejects repeated q parameters", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=one&q=two`);
    const payload = await response.json();
    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "search query must be a string" });
  });
});

test("GET /api/search rejects overly long queries", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=${"x".repeat(201)}`);
    const payload = await response.json();
    assert.equal(response.status, 400);
    assert.match(payload.message, /200 characters/);
  });
});

test("GET /api/search trims valid queries", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=%20api%20`);
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
  });
});
