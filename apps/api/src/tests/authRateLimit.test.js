import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("auth routes use a stricter rate limit than the global API limiter", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const url = `http://127.0.0.1:${port}/api/auth/login`;
    const body = JSON.stringify({
      email: "evelyn@example.com",
      password: "password123"
    });

    for (let request = 0; request < 20; request += 1) {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body
      });

      assert.equal(response.status, 200);
      await response.body?.cancel();
    }

    const limitedResponse = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body
    });

    assert.equal(limitedResponse.status, 429);
    await limitedResponse.body?.cancel();
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
