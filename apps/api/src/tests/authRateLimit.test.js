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

async function postLogin(baseUrl) {
  return fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "user@example.com",
      password: "password123"
    })
  });
}

test("auth endpoints use a stricter route-level rate limit", async () => {
  await withServer(async (baseUrl) => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const response = await postLogin(baseUrl);
      assert.equal(response.status, 200);
      await response.arrayBuffer();
    }

    const limitedResponse = await postLogin(baseUrl);
    const payload = await limitedResponse.json();

    assert.equal(limitedResponse.status, 429);
    assert.deepEqual(payload, {
      success: false,
      message: "Too many authentication attempts, please try again later."
    });
  });
});
