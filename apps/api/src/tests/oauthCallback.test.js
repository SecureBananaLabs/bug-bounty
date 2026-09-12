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
    await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("oauth callback rejects unsupported providers and invalid code values", async () => {
  await withServer(async (port) => {
    const invalidUrls = [
      `http://127.0.0.1:${port}/api/auth/oauth/not-real/callback?code=abc123`,
      `http://127.0.0.1:${port}/api/auth/oauth/github/callback`,
      `http://127.0.0.1:${port}/api/auth/oauth/github/callback?code=`,
      `http://127.0.0.1:${port}/api/auth/oauth/github/callback?code=a&code=b`
    ];

    for (const url of invalidUrls) {
      const response = await fetch(url);
      const payload = await response.json();

      assert.equal(response.status, 400);
      assert.equal(payload.success, false);
    }
  });
});

test("oauth callback accepts supported providers with a valid code", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/oauth/github/callback?code=abc123`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.deepEqual(payload.data, {
      provider: "github",
      status: "callback-received"
    });
  });
});
