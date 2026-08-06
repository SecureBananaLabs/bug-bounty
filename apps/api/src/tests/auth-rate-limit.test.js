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

async function postLogin(baseUrl) {
  return fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "client@example.com", password: "password123" })
  });
}

test("auth login route has stricter per-route rate limit", async () => {
  await withServer(async (baseUrl) => {
    for (let index = 0; index < 20; index += 1) {
      const response = await postLogin(baseUrl);
      assert.notEqual(response.status, 429);
      await response.arrayBuffer();
    }

    const limitedResponse = await postLogin(baseUrl);
    assert.equal(limitedResponse.status, 429);
  });
});
