import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

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

test("rate limiter returns API JSON error payload", async () => {
  const app = createApp();
  const server = await listen(app);

  try {
    const { port } = server.address();
    const url = `http://127.0.0.1:${port}/api/search?q=rate-limit`;
    let response;

    for (let requestNumber = 0; requestNumber <= 200; requestNumber += 1) {
      response = await fetch(url);
    }

    assert.equal(response.status, 429);
    assert.match(response.headers.get("content-type") ?? "", /^application\/json/);
    assert.deepEqual(await response.json(), {
      success: false,
      message: "Too many requests"
    });
  } finally {
    await close(server);
  }
});
