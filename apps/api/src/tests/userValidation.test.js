import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function listen(app) {
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  return server;
}

async function close(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/users defaults the role and keeps the generated id", async () => {
  const server = await listen(createApp());
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/users`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "dev@example.com", password: "super-secret" })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.role, "client");
  assert.ok(payload.data.id.startsWith("usr_"));

  await close(server);
});

test("POST /api/users rejects a payload without an email", async () => {
  const server = await listen(createApp());
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/users`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: "super-secret" })
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "email must be valid");

  await close(server);
});

test("POST /api/users refuses an admin role from the request payload", async () => {
  const server = await listen(createApp());
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/users`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "dev@example.com",
      password: "super-secret",
      role: "admin"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "role must be valid");

  await close(server);
});
