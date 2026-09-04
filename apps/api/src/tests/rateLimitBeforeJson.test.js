import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { apiLimiter } from "../middleware/rateLimit.js";

const LOCAL_RATE_LIMIT_KEYS = ["::ffff:127.0.0.1", "127.0.0.1", "::1"];

function resetLocalRateLimit() {
  for (const key of LOCAL_RATE_LIMIT_KEYS) {
    apiLimiter.resetKey(key);
  }
}

async function listen(app) {
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  return server;
}

async function close(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("malformed JSON requests are counted by the rate limiter before body parsing", async () => {
  resetLocalRateLimit();

  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();
  const originalConsoleError = console.error;

  console.error = () => {};

  try {
    const statuses = [];

    for (let index = 0; index < 205; index += 1) {
      const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{bad json"
      });

      statuses.push(response.status);

      if (response.status === 429) {
        break;
      }
    }

    assert.equal(statuses.at(-1), 429);
    assert.ok(statuses.length <= 205);
  } finally {
    console.error = originalConsoleError;
    await close(server);
    resetLocalRateLimit();
  }
});
