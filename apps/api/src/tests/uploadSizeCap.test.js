import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";
import { MAX_UPLOAD_BYTES } from "../routes/uploadRoutes.js";

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

function headers() {
  return { Authorization: `Bearer ${signAccessToken({ sub: "usr_2", role: "client" })}` };
}

function formWith(content) {
  const form = new FormData();
  form.append("file", new Blob([content]), "notes.txt");
  return form;
}

test("POST /api/uploads stores a file inside the cap", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    headers: headers(),
    body: formWith("hello world")
  });

  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.filename, "notes.txt");
  assert.equal(body.data.status, "uploaded");

  await close(server);
});

test("POST /api/uploads answers 413 once the cap is exceeded", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    headers: headers(),
    body: formWith("x".repeat(MAX_UPLOAD_BYTES + 1024))
  });

  assert.equal(response.status, 413);
  const body = await response.json();
  assert.equal(body.success, false);
  assert.equal(body.message, `File exceeds the ${MAX_UPLOAD_BYTES} byte limit`);

  await close(server);
});
