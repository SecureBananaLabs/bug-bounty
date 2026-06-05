import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function getCallback(baseUrl, path) {
  const response = await fetch(`${baseUrl}${path}`);
  return { response, payload: await response.json() };
}

test("OAuth callback rejects unsupported providers", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await getCallback(baseUrl, "/api/auth/oauth/not-real/callback?code=abc");

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Unsupported OAuth provider" });
  });
});

test("OAuth callback requires a code", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await getCallback(baseUrl, "/api/auth/oauth/github/callback");

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "OAuth code is required" });
  });
});

test("OAuth callback rejects blank codes", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await getCallback(baseUrl, "/api/auth/oauth/github/callback?code=%20%20");

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "OAuth code is required" });
  });
});

test("OAuth callback accepts supported providers with codes", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await getCallback(baseUrl, "/api/auth/oauth/github/callback?code=abc123");

    assert.equal(response.status, 200);
    assert.deepEqual(payload, {
      success: true,
      data: { provider: "github", status: "callback-received" }
    });
  });
});
