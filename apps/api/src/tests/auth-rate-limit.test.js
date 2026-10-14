import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function listen(app) {
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

async function close(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("auth endpoints have a stricter rate limit than general API routes", async () => {
  const app = createApp();
  const { server, baseUrl } = await listen(app);

  try {
    let lastResponse;

    for (let index = 0; index < 21; index += 1) {
      lastResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "tester@example.com", password: "correct-horse-battery-staple" })
      });
    }

    assert.equal(lastResponse.status, 429);
    const payload = await lastResponse.json();
    assert.deepEqual(payload, {
      success: false,
      error: "Too many authentication attempts, please try again later."
    });

    const healthResponse = await fetch(`${baseUrl}/health`);
    assert.equal(healthResponse.status, 200);
  } finally {
    await close(server);
  }
});
