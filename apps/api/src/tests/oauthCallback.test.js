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

test("oauth callback accepts supported provider with code", async () => {
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();

  const res = await fetch(
    `http://127.0.0.1:${port}/api/auth/oauth/github/callback?code=abc123`
  );
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.provider, "github");
  assert.equal(body.data.status, "callback-received");

  await close(server);
});

test("oauth callback rejects unsupported provider", async () => {
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();

  const res = await fetch(
    `http://127.0.0.1:${port}/api/auth/oauth/facebook/callback?code=abc123`
  );
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.success, false);

  await close(server);
});

test("oauth callback rejects missing authorization code", async () => {
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();

  const res = await fetch(
    `http://127.0.0.1:${port}/api/auth/oauth/github/callback`
  );
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.success, false);

  await close(server);
});

test("oauth callback rejects empty authorization code", async () => {
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();

  const res = await fetch(
    `http://127.0.0.1:${port}/api/auth/oauth/google/callback?code=`
  );
  const body = await res.json();

  assert.equal(res.status, 400);
  assert.equal(body.success, false);

  await close(server);
});
