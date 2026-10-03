import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(app) {
  const server = app.listen(0);

  return new Promise((resolve, reject) => {
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("malformed JSON requests are counted by the global API limiter", async () => {
  const app = createApp();
  const server = await listen(app);
  const originalConsoleError = console.error;

  try {
    console.error = () => {};

    const { port } = server.address();
    let response;

    for (let index = 0; index < 201; index += 1) {
      response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{"
      });
    }

    assert.equal(response.status, 429);
  } finally {
    console.error = originalConsoleError;
    await close(server);
  }
});
