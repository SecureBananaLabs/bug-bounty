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

test("GET /api/auth/oauth/:provider/callback rejects unsupported providers", async () => {
  await withServer(async (baseUrl) => {
    const unsupportedProviders = ["github-enterprise", "null", "this-provider-is-not-supported"];

    for (const provider of unsupportedProviders) {
      const response = await fetch(`${baseUrl}/api/auth/oauth/${provider}/callback`);
      const body = await response.json();

      assert.equal(response.status, 400);
      assert.deepEqual(body, { success: false, message: "Unsupported OAuth provider" });
    }
  });
});

test("GET /api/auth/oauth/:provider/callback accepts supported providers", async () => {
  await withServer(async (baseUrl) => {
    for (const provider of ["github", "google"]) {
      const response = await fetch(`${baseUrl}/api/auth/oauth/${provider}/callback`);
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.deepEqual(body, {
        success: true,
        data: {
          provider,
          status: "callback-received"
        }
      });
    }
  });
});
