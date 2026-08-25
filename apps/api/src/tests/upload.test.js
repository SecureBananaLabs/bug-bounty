import test from "node:test";
import assert from "node:assert/strict";
import { Blob } from "node:buffer";
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

test("POST /api/uploads rejects multipart requests without a file", async () => {
  const server = await startServer();
  const { port } = server.address();

  const formData = new FormData();
  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    body: formData
  });

  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(payload, {
    success: false,
    message: "Upload requests must include a file"
  });

  await stopServer(server);
});

test("POST /api/uploads accepts multipart uploads with a file", async () => {
  const server = await startServer();
  const { port } = server.address();

  const formData = new FormData();
  formData.append(
    "file",
    new Blob(["hello world"], { type: "text/plain" }),
    "hello.txt"
  );

  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    body: formData
  });

  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.deepEqual(payload, {
    success: true,
    data: {
      filename: "hello.txt",
      status: "uploaded"
    }
  });

  await stopServer(server);
});
