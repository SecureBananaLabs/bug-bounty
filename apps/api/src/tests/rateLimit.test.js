import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function closeServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("global rate limiter returns API JSON error payload", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    let response;

    for (let i = 0; i < 201; i += 1) {
      response = await fetch(`http://127.0.0.1:${port}/health`);
    }

    const payload = await response.json();

    assert.equal(response.status, 429);
    assert.match(response.headers.get("content-type"), /application\/json/);
    assert.deepEqual(payload, {
      success: false,
      message: "Too many requests"
    });
  } finally {
    await closeServer(server);
  }
});
