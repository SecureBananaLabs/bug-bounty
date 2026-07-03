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
    await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("auth routes return 429 after the auth-specific limit is exceeded", async () => {
  await withServer(async (port) => {
    for (let index = 0; index < 5; index += 1) {
      const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "worker@example.com",
          password: "strongpass1"
        })
      });

      assert.equal(response.status, 200);
    }

    const limited = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "worker@example.com",
        password: "strongpass1"
      })
    });
    const payload = await limited.json();

    assert.equal(limited.status, 429);
    assert.deepEqual(payload, {
      success: false,
      message: "Too many auth attempts"
    });
  });
});
