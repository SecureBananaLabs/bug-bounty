import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("GET /health returns ok payload", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/health`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(payload, { ok: true, service: "api" });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

async function startServer() {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  return server;
}

function serverUrl(server, path) {
  const { port } = server.address();
  return `http://127.0.0.1:${port}${path}`;
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("createApp instances do not share API rate-limit counters", async () => {
  const firstServer = await startServer();

  try {
    for (let i = 0; i < 200; i += 1) {
      const response = await fetch(serverUrl(firstServer, "/api/search"));
      assert.notEqual(response.status, 429);
    }
  } finally {
    await closeServer(firstServer);
  }

  const secondServer = await startServer();

  try {
    const response = await fetch(serverUrl(secondServer, "/api/search"));

    assert.equal(response.status, 200);
  } finally {
    await closeServer(secondServer);
  }
});
