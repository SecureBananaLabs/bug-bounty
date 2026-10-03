import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function startTestServer() {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

async function closeTestServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("OAuth callback rejects unsupported providers", async () => {
  const { server, baseUrl } = await startTestServer();

  const response = await fetch(`${baseUrl}/api/auth/oauth/not-real/callback?code=abc123`);
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(payload, { success: false, message: "Unsupported OAuth provider" });

  await closeTestServer(server);
});

test("OAuth callback requires an authorization code", async () => {
  const { server, baseUrl } = await startTestServer();

  const response = await fetch(`${baseUrl}/api/auth/oauth/github/callback`);
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(payload, { success: false, message: "OAuth authorization code is required" });

  await closeTestServer(server);
});

test("OAuth callback rejects blank authorization codes", async () => {
  const { server, baseUrl } = await startTestServer();

  const response = await fetch(`${baseUrl}/api/auth/oauth/github/callback?code=%20%20`);
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(payload, { success: false, message: "OAuth authorization code is required" });

  await closeTestServer(server);
});

test("OAuth callback accepts supported providers with a code", async () => {
  const { server, baseUrl } = await startTestServer();

  const response = await fetch(`${baseUrl}/api/auth/oauth/github/callback?code=abc123`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(payload, {
    success: true,
    data: {
      provider: "github",
      status: "callback-received"
    }
  });

  await closeTestServer(server);
});
