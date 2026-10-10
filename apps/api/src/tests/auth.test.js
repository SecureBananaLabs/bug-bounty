import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(app) {
  const server = app.listen(0);
  return new Promise((res, rej) => { server.once("listening", () => res(server)); server.once("error", rej); });
}
function close(server) {
  return new Promise((res, rej) => server.close((e) => e ? rej(e) : res()));
}

test("POST /api/auth/register - rejects admin role", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "a@b.com", password: "password1", fullName: "Test", role: "admin" })
  });
  assert.ok(res.status === 400 || res.status === 422, `expected 4xx got ${res.status}`);
  await close(server);
});

test("POST /api/auth/register - rejects missing fullName", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "a@b.com", password: "password1" })
  });
  assert.ok(res.status === 400 || res.status === 422, `expected 4xx got ${res.status}`);
  await close(server);
});

test("POST /api/auth/register - token sub matches returned id", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@example.com", password: "password1", fullName: "Test User", role: "client" })
  });
  const body = await res.json();
  assert.equal(res.status, 201);
  const decoded = JSON.parse(Buffer.from(body.data.token.split(".")[1], "base64url").toString());
  assert.equal(decoded.sub, body.data.id, "JWT sub must match returned id");
  await close(server);
});

test("POST /api/auth/refresh - rejects missing token with error", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({})
  });
  assert.ok(res.status >= 400, `expected error status got ${res.status}`);
  await close(server);
});
