import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

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

function upload(port, token, bytes) {
  const body = new FormData();
  body.set("file", new Blob([bytes], { type: "text/plain" }), "notes.txt");

  return fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body
  });
}

test("POST /api/uploads stores a small file", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  const token = signAccessToken({ sub: "usr_7", role: "freelancer" });

  const response = await upload(port, token, "hello world");
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.filename, "notes.txt");
  assert.equal(payload.data.status, "uploaded");

  await close(server);
});

test("POST /api/uploads rejects a file above the configured cap", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  const token = signAccessToken({ sub: "usr_7", role: "freelancer" });

  const response = await upload(port, token, "x".repeat(6 * 1024 * 1024));

  assert.equal(response.status, 413);
  const payload = await response.json();
  assert.equal(payload.success, false);

  await close(server);
});
