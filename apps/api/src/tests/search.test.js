import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(t) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  return `http://127.0.0.1:${server.address().port}`;
}

test("GET /api/search rejects a missing query", async (t) => {
  const baseUrl = await withServer(t);
  const response = await fetch(`${baseUrl}/api/search`);
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(payload, { success: false, message: "Search query is required" });
});

test("GET /api/search rejects a blank query", async (t) => {
  const baseUrl = await withServer(t);
  const response = await fetch(`${baseUrl}/api/search?q=`);
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(payload, { success: false, message: "Search query is required" });
});

test("GET /api/search rejects a whitespace-only query", async (t) => {
  const baseUrl = await withServer(t);
  const response = await fetch(`${baseUrl}/api/search?q=%20%20%20`);
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(payload, { success: false, message: "Search query is required" });
});

test("GET /api/search accepts and trims a valid query", async (t) => {
  const baseUrl = await withServer(t);
  const response = await fetch(`${baseUrl}/api/search?q=%20designer%20`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(payload, {
    success: true,
    data: {
      query: "designer",
      users: [],
      jobs: [],
      freelancers: []
    }
  });
});
