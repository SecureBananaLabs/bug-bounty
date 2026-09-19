import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(app) {
  const server = app.listen(0);

  return new Promise((resolve, reject) => {
    server.once("listening", () => {
      resolve({
        baseUrl: `http://127.0.0.1:${server.address().port}`,
        server
      });
    });
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("GET /api/auth/oauth/:provider/callback rejects unsupported providers", async () => {
  const { baseUrl, server } = await listen(createApp());

  try {
    const response = await fetch(`${baseUrl}/api/auth/oauth/unknown/callback?code=abc123`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  } finally {
    await close(server);
  }
});

test("GET /api/auth/oauth/:provider/callback requires an authorization code", async () => {
  const { baseUrl, server } = await listen(createApp());

  try {
    const response = await fetch(`${baseUrl}/api/auth/oauth/github/callback`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  } finally {
    await close(server);
  }
});

test("GET /api/auth/oauth/:provider/callback accepts supported provider with code", async () => {
  const { baseUrl, server } = await listen(createApp());

  try {
    const response = await fetch(`${baseUrl}/api/auth/oauth/github/callback?code=abc123`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.provider, "github");
    assert.equal(payload.data.status, "callback-received");
  } finally {
    await close(server);
  }
});
