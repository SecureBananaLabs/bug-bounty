import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/auth/oauth/:provider/callback rejects unsupported providers", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/api/auth/oauth/not-real/callback?code=abc123`,
    );
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Unsupported OAuth provider",
    });
  });
});

test("GET /api/auth/oauth/:provider/callback requires one non-empty code", async () => {
  await withServer(async (baseUrl) => {
    const missing = await fetch(`${baseUrl}/api/auth/oauth/github/callback`);
    const blank = await fetch(`${baseUrl}/api/auth/oauth/github/callback?code=`);
    const repeated = await fetch(
      `${baseUrl}/api/auth/oauth/github/callback?code=one&code=two`,
    );

    assert.equal(missing.status, 400);
    assert.equal(blank.status, 400);
    assert.equal(repeated.status, 400);

    assert.deepEqual(await missing.json(), {
      success: false,
      message: "OAuth authorization code is required",
    });
  });
});

test("GET /api/auth/oauth/:provider/callback accepts supported providers with a code", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/api/auth/oauth/GitHub/callback?code=abc123`,
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload, {
      success: true,
      data: {
        provider: "github",
        status: "callback-received",
      },
    });
  });
});
