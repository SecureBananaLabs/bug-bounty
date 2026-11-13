import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function startServer() {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  return server;
}

async function stopServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/uploads rejects oversized files with 413", async () => {
  const server = await startServer();
  const { port } = server.address();

  const form = new FormData();
  form.append("file", new Blob([Buffer.alloc((1024 * 1024) + 1, "a")]), "too-large.txt");

  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    body: form
  });
  const payload = await response.json();

  assert.equal(response.status, 413);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Uploaded file is too large");

  await stopServer(server);
});

test("POST /api/uploads still accepts small files", async () => {
  const server = await startServer();
  const { port } = server.address();

  const form = new FormData();
  form.append("file", new Blob(["hello world"]), "small.txt");

  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    body: form
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.filename, "small.txt");
  assert.equal(payload.data.status, "uploaded");

  await stopServer(server);
});
