import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("GET /health bypasses API rate limiting after the API quota is exhausted", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;

    for (let i = 0; i < 200; i += 1) {
      const response = await fetch(`${baseUrl}/api/search?q=ok`);
      assert.equal(response.status, 200);
    }

    const limitedResponse = await fetch(`${baseUrl}/api/search?q=blocked`);
    assert.equal(limitedResponse.status, 429);

    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthPayload = await healthResponse.json();

    assert.equal(healthResponse.status, 200);
    assert.deepEqual(healthPayload, { ok: true, service: "api" });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
