import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function startServer() {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  return server;
}

async function closeServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("API rate limiter runs before JSON body parsing", async () => {
  const server = await startServer();
  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    const { port } = server.address();
    let sawTooManyRequests = false;

    for (let index = 0; index < 205; index += 1) {
      const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{bad json"
      });

      if (response.status === 429) {
        sawTooManyRequests = true;
        break;
      }
    }

    assert.equal(sawTooManyRequests, true);
  } finally {
    console.error = originalConsoleError;
    await closeServer(server);
  }
});
