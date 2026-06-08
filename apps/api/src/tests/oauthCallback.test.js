import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("GET /api/auth/oauth/not-real/callback returns 400 for unsupported provider", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));

  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/auth/oauth/not-real/callback?code=abc`);
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.success, false);
  assert.ok(body.message.includes("Unsupported OAuth provider"));

  await new Promise((r) => server.close(r));
});

test("GET /api/auth/oauth/github/callback returns 400 when code is missing", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));

  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/auth/oauth/github/callback`);
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.success, false);
  assert.ok(body.message.includes("Missing or blank OAuth authorization code"));

  await new Promise((r) => server.close(r));
});

test("GET /api/auth/oauth/github/callback returns 400 when code is blank", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));

  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/auth/oauth/github/callback?code=`);
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.success, false);
  assert.ok(body.message.includes("Missing or blank OAuth authorization code"));

  await new Promise((r) => server.close(r));
});

test("GET /api/auth/oauth/github/callback returns 400 when code is whitespace only", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));

  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/auth/oauth/github/callback?code=%20%20`);
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.success, false);
  assert.ok(body.message.includes("Missing or blank OAuth authorization code"));

  await new Promise((r) => server.close(r));
});

test("GET /api/auth/oauth/github/callback returns success with valid code", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));

  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/auth/oauth/github/callback?code=valid_code_123`);
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.provider, "github");
  assert.equal(body.data.status, "callback-received");

  await new Promise((r) => server.close(r));
});

test("GET /api/auth/oauth/google/callback returns success with valid code", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));

  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/auth/oauth/google/callback?code=google_auth_code`);
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.provider, "google");
  assert.equal(body.data.status, "callback-received");

  await new Promise((r) => server.close(r));
});
