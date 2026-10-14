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

test("health remains available after API requests exhaust the shared limiter", async () => {
  await withServer(async (port) => {
    let apiRateLimited = false;

    for (let attempt = 0; attempt < 210; attempt += 1) {
      const response = await fetch(`http://127.0.0.1:${port}/api/jobs`);
      await response.text();

      if (response.status === 429) {
        apiRateLimited = true;
        break;
      }
    }

    assert.equal(apiRateLimited, true);

    const healthResponse = await fetch(`http://127.0.0.1:${port}/health`);
    const healthPayload = await healthResponse.json();

    assert.equal(healthResponse.status, 200);
    assert.deepEqual(healthPayload, { ok: true, service: "api" });
  });
});
