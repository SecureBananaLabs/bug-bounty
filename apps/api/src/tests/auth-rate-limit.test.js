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
    return await callback("http://127.0.0.1:" + port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/auth/login is limited after 20 requests", async () => {
  await withServer(async (baseUrl) => {
    const request = () => fetch(baseUrl + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "client@example.com",
        password: "password123"
      })
    });

    for (let i = 0; i < 20; i += 1) {
      const response = await request();
      assert.equal(response.status, 200);
    }

    const limited = await request();
    assert.equal(limited.status, 429);
  });
});
