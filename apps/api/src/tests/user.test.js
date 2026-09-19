import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /users requires name and email", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((r, e) => server.once("listening", r).once("error", e));
  const { port } = server.address();

  // Empty body → 400
  let res = await fetch(`http://127.0.0.1:${port}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert.equal(res.status, 400);

  // Body with client-controlled id → 400 (strict schema rejects unknown fields)
  res = await fetch(`http://127.0.0.1:${port}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: "usr_evil", name: "Hacker", email: "a@b.com" }),
  });
  assert.equal(res.status, 400);

  // Valid body → 201
  res = await fetch(`http://127.0.0.1:${port}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Ed", email: "ed@example.com" }),
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.ok(body.success);
  assert.equal(body.data.name, "Ed");
  assert.equal(body.data.email, "ed@example.com");
  assert.equal(body.data.role, "client");
  // Server-generated id must not be attacker-controlled
  assert.ok(body.data.id.startsWith("usr_"));

  // Admin role is rejected
  res = await fetch(`http://127.0.0.1:${port}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Bot", email: "bot@x.com", role: "admin" }),
  });
  assert.equal(res.status, 400);

  await new Promise((r, e) => server.close((err) => (err ? e(err) : r())));
});
