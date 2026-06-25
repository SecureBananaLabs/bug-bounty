import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function listen(app) {
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

async function close(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("GET /api/search returns existing shape for valid query", async () => {
  const app = createApp();
  const { server, baseUrl } = await listen(app);

  const response = await fetch(`${baseUrl}/api/search?q=node`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.data.query, "node");
  assert.deepEqual(payload.data.users, []);
  assert.deepEqual(payload.data.jobs, []);
  assert.deepEqual(payload.data.freelancers, []);

  await close(server);
});

test("GET /api/search treats missing query as empty string", async () => {
  const app = createApp();
  const { server, baseUrl } = await listen(app);

  const response = await fetch(`${baseUrl}/api/search`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.data.query, "");

  await close(server);
});

test("GET /api/search trims surrounding whitespace", async () => {
  const app = createApp();
  const { server, baseUrl } = await listen(app);

  const response = await fetch(`${baseUrl}/api/search?q=%20%20node%20%20`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.data.query, "node");

  await close(server);
});

test("GET /api/search rejects query longer than 200 characters", async () => {
  const app = createApp();
  const { server, baseUrl } = await listen(app);

  const longQuery = "a".repeat(201);
  const response = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent(longQuery)}`);
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Invalid search query");

  await close(server);
});

test("GET /api/search rejects array query input", async () => {
  const app = createApp();
  const { server, baseUrl } = await listen(app);

  const response = await fetch(`${baseUrl}/api/search?q=foo&q=bar`);
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Invalid search query");

  await close(server);
});
