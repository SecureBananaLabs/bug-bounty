import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function startTestServer() {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

async function closeTestServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("GET /health returns ok payload", async () => {
  const { server, baseUrl } = await startTestServer();

  const response = await fetch(`${baseUrl}/health`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(payload, { ok: true, service: "api" });

  await closeTestServer(server);
});

test("GET /health bypasses the API rate limiter", async () => {
  const { server, baseUrl } = await startTestServer();
  let payload;
  let response;

  for (let i = 0; i < 201; i += 1) {
    response = await fetch(`${baseUrl}/health`);
    payload = await response.json();
  }

  assert.equal(response.status, 200);
  assert.deepEqual(payload, { ok: true, service: "api" });

  await closeTestServer(server);
});
