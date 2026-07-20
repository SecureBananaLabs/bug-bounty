import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(app) {
  const server = app.listen(0);
  return new Promise((resolve, reject) => {
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

test("POST /api/auth/register with invalid payload returns 400", async () => {
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "not-an-email", password: "short" })
  });
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.success, false);
  assert.ok(body.message, "should include validation error message");

  await close(server);
});

test("POST /api/auth/register with missing fields returns 400", async () => {
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.success, false);

  await close(server);
});

test("POST /api/auth/login with invalid email returns 400", async () => {
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "bad", password: "12345678" })
  });
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.success, false);

  await close(server);
});

test("POST /api/jobs with invalid payload returns 400", async () => {
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "ab" })
  });
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.success, false);

  await close(server);
});
