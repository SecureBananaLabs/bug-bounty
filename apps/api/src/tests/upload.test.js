import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function startApp(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => resolve(server));
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/uploads without file returns 400", async () => {
  const server = await startApp(createApp());
  const { port } = server.address();

  const formData = new FormData();
  const res = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    body: formData,
  });
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.success, false);
  assert.match(body.message, /No file provided/);
  await close(server);
});

test("POST /api/uploads with file returns 201", async () => {
  const server = await startApp(createApp());
  const { port } = server.address();

  const formData = new FormData();
  const blob = new Blob(["hello world"], { type: "text/plain" });
  formData.append("file", blob, "test.txt");

  const res = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    body: formData,
  });
  const body = await res.json();

  assert.equal(res.status, 201);
  assert.equal(body.success, true);
  assert.equal(body.data.status, "uploaded");
  assert.equal(body.data.filename, "test.txt");
  await close(server);
});
