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

test("GET /api/search rejects an anonymous caller", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/search?q=design`);
  const payload = await response.json();

  assert.equal(response.status, 401);
  assert.deepEqual(payload, { success: false, message: "Unauthorized" });

  await close(server);
});

test("GET /api/search answers a request carrying a valid bearer token", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  const token = signAccessToken({ sub: "usr_7", role: "client" });

  const response = await fetch(`http://127.0.0.1:${port}/api/search?q=design`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(payload, {
    success: true,
    data: { query: "design", users: [], jobs: [], freelancers: [] }
  });

  await close(server);
});

test("GET /api/search rejects a malformed bearer token", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/search?q=design`, {
    headers: { Authorization: "Bearer not-a-real-token" }
  });
  const payload = await response.json();

  assert.equal(response.status, 401);
  assert.deepEqual(payload, { success: false, message: "Invalid token" });

  await close(server);
});
