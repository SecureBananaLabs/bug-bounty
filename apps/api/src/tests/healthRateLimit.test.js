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

test("GET /health is not rate limited by the shared API limiter", async () => {
  await withServer(async (baseUrl) => {
    for (let attempt = 1; attempt <= 205; attempt += 1) {
      const response = await fetch(`${baseUrl}/health`);
      assert.equal(response.status, 200, `attempt ${attempt} returned ${response.status}`);
      await response.body?.cancel();
    }
  });
});
