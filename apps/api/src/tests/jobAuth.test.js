import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("POST /api/jobs rejects unauthenticated requests", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "test" }),
  });

  assert.equal(response.status, 401);
  const payload = await response.json();
  assert.equal(payload.success, false);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/jobs accepts authenticated requests", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const token = signAccessToken({ sub: "user-1" });

  const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title: "Build a website" }),
  });

  // We expect the request to pass auth and reach the controller
  // (may return 201 or 400 depending on required fields, but not 401)
  assert.notEqual(response.status, 401);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET /api/jobs remains public without auth", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/jobs`);

  assert.notEqual(response.status, 401);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
