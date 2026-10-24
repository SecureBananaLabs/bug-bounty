import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withTestServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /health bypasses the shared API rate limiter", async () => {
  await withTestServer(async (baseUrl) => {
    for (let requestNumber = 1; requestNumber <= 201; requestNumber += 1) {
      const response = await fetch(`${baseUrl}/health`);
      assert.equal(response.status, 200, `request ${requestNumber} should not be rate limited`);
    }
  });
});
