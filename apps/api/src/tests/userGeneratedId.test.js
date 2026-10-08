import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

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

test("POST /api/users keeps the generated id even when the payload supplies one", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: "squatter",
      email: "ada@example.com",
      role: "freelancer"
    })
  });

  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.match(body.data.id, /^usr_\d+$/);
  assert.equal(body.data.email, "ada@example.com");
  assert.equal(body.data.role, "freelancer");

  await close(server);
});

test("GET /api/users returns the stored snapshot without mutating it", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  const created = await fetch(`http://127.0.0.1:${port}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "grace@example.com", role: "client" })
  });
  const createdBody = await created.json();

  const listed = await fetch(`http://127.0.0.1:${port}/api/users`);
  assert.equal(listed.status, 200);
  const listBody = await listed.json();

  assert.equal(listBody.success, true);
  assert.ok(listBody.data.length >= 1);
  assert.equal(listBody.data.at(-1).id, createdBody.data.id);
  assert.equal(listBody.data.at(-1).email, "grace@example.com");

  await close(server);
});
