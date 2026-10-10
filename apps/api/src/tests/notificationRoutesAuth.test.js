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

test("notification routes reject anonymous and malformed callers", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  const anonymous = await fetch(`http://127.0.0.1:${port}/api/notifications`);
  assert.equal(anonymous.status, 401);
  const anonymousBody = await anonymous.json();
  assert.equal(anonymousBody.success, false);
  assert.equal(anonymousBody.message, "Unauthorized");

  const malformed = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
    headers: { Authorization: "Bearer not-a-real-token" }
  });
  assert.equal(malformed.status, 401);
  const malformedBody = await malformed.json();
  assert.equal(malformedBody.message, "Invalid token");

  await close(server);
});

test("notification routes answer a bearer token holder", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${signAccessToken({ sub: "usr_7", role: "client" })}`
  };

  const created = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
    method: "POST",
    headers,
    body: JSON.stringify({ userId: "usr_7", message: "New proposal" })
  });
  assert.equal(created.status, 201);
  const createdBody = await created.json();
  assert.match(createdBody.data.id, /^ntf_/);
  assert.equal(createdBody.data.read, false);

  const listed = await fetch(`http://127.0.0.1:${port}/api/notifications`, { headers });
  assert.equal(listed.status, 200);
  const listBody = await listed.json();
  assert.ok(listBody.data.some((item) => item.id === createdBody.data.id));

  await close(server);
});
