import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/auth/login is capped by the auth-specific limiter", async () => {
  await withServer(async (baseUrl) => {
    const body = JSON.stringify({
      email: "person@example.com",
      password: "password123"
    });

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body
      });

      assert.equal(response.status, 200);
    }

    const limitedResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body
    });
    const payload = await limitedResponse.json();

    assert.equal(limitedResponse.status, 429);
    assert.deepEqual(payload, {
      success: false,
      message: "Too many authentication attempts"
    });
  });
});
