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

test("GET /api/messages rejects an anonymous caller", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/messages`);
  const payload = await response.json();

  assert.equal(response.status, 401);
  assert.deepEqual(payload, { success: false, message: "Unauthorized" });

  await close(server);
});

test("POST /api/messages rejects a malformed bearer token", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer not-a-real-token" },
    body: JSON.stringify({ body: "hello" })
  });
  const payload = await response.json();

  assert.equal(response.status, 401);
  assert.deepEqual(payload, { success: false, message: "Invalid token" });

  await close(server);
});

test("message routes answer a request carrying a valid bearer token", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  const token = signAccessToken({ sub: "usr_21", role: "client" });

  const created = await fetch(`http://127.0.0.1:${port}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ body: "hello" })
  });
  const createdPayload = await created.json();

  assert.equal(created.status, 201);
  assert.equal(createdPayload.success, true);
  assert.equal(createdPayload.data.body, "hello");

  const listed = await fetch(`http://127.0.0.1:${port}/api/messages`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const listedPayload = await listed.json();

  assert.equal(listed.status, 200);
  assert.equal(listedPayload.data.at(-1).id, createdPayload.data.id);

  await close(server);
});
