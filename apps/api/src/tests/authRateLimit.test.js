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
    return await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("auth endpoints enforce a stricter credential-attempt rate limit", async () => {
  await withServer(async (baseUrl) => {
    const body = JSON.stringify({
      email: "client@example.com",
      password: "correct-horse-battery"
    });

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body
      });

      assert.equal(response.status, 200);
    }

    const limitedResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body
    });
    const payload = await limitedResponse.json();

    assert.equal(limitedResponse.status, 429);
    assert.deepEqual(payload, {
      success: false,
      message: "Too many authentication attempts, try again later"
    });
  });
});

test("non-auth API routes remain on the general limiter", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload, { ok: true, service: "api" });
  });
});
