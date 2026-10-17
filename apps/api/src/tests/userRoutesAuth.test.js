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

test("user routes reject callers without a bearer token", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  for (const method of ["GET", "POST"]) {
    const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "GET" ? undefined : JSON.stringify({ email: "a@example.com" })
    });

    assert.equal(response.status, 401);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Unauthorized");
  }

  const malformed = await fetch(`http://127.0.0.1:${port}/api/users`, {
    headers: { Authorization: "Bearer not-a-real-token" }
  });
  assert.equal(malformed.status, 401);
  const malformedBody = await malformed.json();
  assert.equal(malformedBody.message, "Invalid token");

  await close(server);
});

test("user routes answer a bearer token holder", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${signAccessToken({ sub: "usr_5", role: "client" })}`
  };

  const created = await fetch(`http://127.0.0.1:${port}/api/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email: "ada@example.com", role: "freelancer" })
  });
  assert.equal(created.status, 201);
  const createdBody = await created.json();
  assert.match(createdBody.data.id, /^usr_\d+$/);

  const listed = await fetch(`http://127.0.0.1:${port}/api/users`, { headers });
  assert.equal(listed.status, 200);
  const listBody = await listed.json();
  assert.ok(listBody.data.some((item) => item.email === "ada@example.com"));

  await close(server);
});
