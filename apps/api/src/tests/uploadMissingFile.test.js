import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0);
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/uploads without a file is reported as a failure", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  const form = new FormData();
  form.append("note", "no attachment here");

  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    body: form
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "No file provided in the file field");

  await close(server);
});

test("POST /api/uploads with a file still returns 201", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  const form = new FormData();
  form.append("file", new Blob(["hello"], { type: "text/plain" }), "hello.txt");

  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    body: form
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.filename, "hello.txt");
  assert.equal(payload.data.status, "uploaded");

  await close(server);
});
