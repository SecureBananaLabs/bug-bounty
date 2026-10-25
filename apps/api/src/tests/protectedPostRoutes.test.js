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
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

for (const path of ["/api/notifications", "/api/payments", "/api/users"]) {
  test(`POST ${path} rejects unauthenticated requests`, async () => {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });
      const payload = await response.json();

      assert.equal(response.status, 401);
      assert.deepEqual(payload, {
        success: false,
        message: "Unauthorized"
      });
    });
  });
}
