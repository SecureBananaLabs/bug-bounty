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
    await run(server.address().port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/auth/oauth/:provider/callback accepts allowed providers", async () => {
  await withServer(async (port) => {
    for (const provider of ["github", "google", "GITHUB"]) {
      const response = await fetch(`http://127.0.0.1:${port}/api/auth/oauth/${provider}/callback`);
      const payload = await response.json();

      assert.equal(response.status, 200);
      assert.deepEqual(payload, {
        success: true,
        data: {
          provider: provider.toLowerCase(),
          status: "callback-received"
        }
      });
    }
  });
});

test("GET /api/auth/oauth/:provider/callback rejects invalid providers", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/oauth/evil_provider/callback`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid provider"
    });
  });
});
