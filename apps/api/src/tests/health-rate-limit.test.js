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

test("GET /health stays available after API rate limit is exhausted", async () => {
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();

  try {
    for (let requestNumber = 1; requestNumber <= 201; requestNumber += 1) {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      await response.arrayBuffer();

      assert.equal(
        response.status,
        200,
        `request ${requestNumber} returned ${response.status}`
      );
    }
  } finally {
    await close(server);
  }
});
