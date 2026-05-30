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

test("POST /api/auth/login is throttled before the generic API limit", async () => {
  await withServer(async (baseUrl) => {
    const requestBody = JSON.stringify({
      email: "client@example.com",
      password: "correct-password"
    });

    let response;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: requestBody
      });
    }

    assert.equal(response.status, 200);

    const throttled = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: requestBody
    });
    const payload = await throttled.json();

    assert.equal(throttled.status, 429);
    assert.equal(payload.success, false);
    assert.match(payload.message, /authentication attempts/i);
  });
});
