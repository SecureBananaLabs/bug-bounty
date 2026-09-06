import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createApiLimiter } from "../middleware/rateLimit.js";

async function withServer(assertions, appFactory = createApp) {
  const app = appFactory();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("malformed JSON consumes rate limit budget before parsing", async () => {
  const limiter = createApiLimiter({ limit: 1 });

  await withServer(async (baseUrl) => {
    const malformedResponse = await fetch(`${baseUrl}/health`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: "{"
    });

    assert.equal(malformedResponse.status, 400);
    assert.equal((await malformedResponse.json()).message, "Invalid JSON payload");

    const firstGood = await fetch(`${baseUrl}/health`);
    assert.equal(firstGood.status, 429);
  }, () => createApp({ limiter }));
});
