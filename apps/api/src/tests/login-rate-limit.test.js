import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
  const server = createApp().listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("POST /api/auth/login blocks the sixth attempt in the rate-limit window", async () => {
  await withServer(async (baseUrl) => {
    const request = () => fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "user@example.com", password: "password123" })
    });

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const response = await request();
      assert.equal(response.status, 200, `attempt ${attempt} should be allowed`);
    }

    const blocked = await request();
    assert.equal(blocked.status, 429);
  });
});

test("the stricter login limiter does not affect unrelated endpoints", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, service: "api" });
  });
});
