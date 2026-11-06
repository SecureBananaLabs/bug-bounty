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

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function getJson(baseUrl, path) {
  const response = await fetch(`${baseUrl}${path}`);
  return { response, body: await response.json() };
}

test("OAuth callback rejects unsupported providers", async () => {
  await withServer(async (baseUrl) => {
    const { response, body } = await getJson(
      baseUrl,
      "/api/auth/oauth/not-real/callback?code=auth-code"
    );

    assert.equal(response.status, 400);
    assert.deepEqual(body, {
      success: false,
      message: "Unsupported OAuth provider"
    });
  });
});

test("OAuth callback rejects missing authorization codes", async () => {
  await withServer(async (baseUrl) => {
    const { response, body } = await getJson(baseUrl, "/api/auth/oauth/github/callback");

    assert.equal(response.status, 400);
    assert.deepEqual(body, {
      success: false,
      message: "Missing OAuth code"
    });
  });
});

test("OAuth callback accepts supported providers with authorization codes", async () => {
  await withServer(async (baseUrl) => {
    const { response, body } = await getJson(
      baseUrl,
      "/api/auth/oauth/github/callback?code=auth-code"
    );

    assert.equal(response.status, 200);
    assert.deepEqual(body, {
      success: true,
      data: {
        provider: "github",
        status: "callback-received"
      }
    });
  });
});
