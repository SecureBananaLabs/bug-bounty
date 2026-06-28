import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createApp } from "../app.js";

test("POST /api/auth/login returns 400 for malformed JSON body", async () => {
  const app = createApp();
  const server = createServer(app);
  await new Promise((resolve, reject) => {
    server.listen(0, (error) => (error ? reject(error) : resolve()));
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: '{"email":"x@example.com","password":'
  });

  const payload = await response.json();
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Malformed JSON payload");
});

test("POST /api/auth/login returns 413 for oversized JSON body", async () => {
  const oversizedPayload = JSON.stringify({
    email: "x@example.com",
    password: "x".repeat(200_000)
  });
  const app = createApp();
  const server = createServer(app);
  await new Promise((resolve, reject) => {
    server.listen(0, (error) => (error ? reject(error) : resolve()));
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: oversizedPayload
  });
  const payload = await response.json();
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

  assert.equal(response.status, 413);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Payload too large");
});
