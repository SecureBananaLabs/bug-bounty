import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("POST /api/uploads rejects unauthenticated upload requests with HTTP 401", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const formData = new FormData();
  formData.append("file", new Blob(["hello file"], { type: "text/plain" }), "sample.txt");

  const res = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    body: formData
  });

  const payload = await res.json();
  assert.equal(res.status, 401);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Unauthorized");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/uploads rejects requests with invalid token with HTTP 401", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const formData = new FormData();
  formData.append("file", new Blob(["hello file"], { type: "text/plain" }), "sample.txt");

  const res = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    headers: {
      "Authorization": "Bearer bad_token"
    },
    body: formData
  });

  const payload = await res.json();
  assert.equal(res.status, 401);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Invalid token");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/uploads allows authenticated requests with valid Bearer token", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const validToken = signAccessToken({ sub: "usr_uploader", role: "client" });
  const { port } = server.address();
  const formData = new FormData();
  formData.append("file", new Blob(["hello file"], { type: "text/plain" }), "verified.txt");

  const res = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${validToken}`
    },
    body: formData
  });

  const payload = await res.json();
  assert.equal(res.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.filename, "verified.txt");
  assert.equal(payload.data.status, "uploaded");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
