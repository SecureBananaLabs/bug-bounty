import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("GET /api/messages returns 401 when unauthenticated", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/messages`);
  const payload = await response.json();

  assert.equal(response.status, 401);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Unauthorized");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/messages returns 401 when unauthenticated", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: "Hello world" })
  });

  assert.equal(response.status, 401);
  const payload = await response.json();
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Unauthorized");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET and POST /api/messages succeed with valid auth token", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const token = signAccessToken({ id: "usr_sender123", email: "alice@example.com" });

  const postRes = await fetch(`http://127.0.0.1:${port}/api/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ content: "Secret message", recipientId: "usr_bob" })
  });

  assert.equal(postRes.status, 201);
  const postPayload = await postRes.json();
  assert.equal(postPayload.success, true);
  assert.equal(postPayload.data.content, "Secret message");

  const getRes = await fetch(`http://127.0.0.1:${port}/api/messages`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  assert.equal(getRes.status, 200);
  const getPayload = await getRes.json();
  assert.equal(getPayload.success, true);
  assert.ok(Array.isArray(getPayload.data));

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
