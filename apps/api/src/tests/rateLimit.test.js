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

  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function search(baseUrl) {
  const response = await fetch(`${baseUrl}/api/search?q=limiter`);
  await response.text();
  return response;
}

test("createApp instances keep rate-limit state isolated", async (t) => {
  const first = await startServer();
  const second = await startServer();

  t.after(async () => {
    await Promise.all([closeServer(first.server), closeServer(second.server)]);
  });

  for (let request = 0; request < 200; request += 1) {
    const response = await search(first.baseUrl);
    assert.notEqual(response.status, 429);
  }

  const limited = await search(first.baseUrl);
  assert.equal(limited.status, 429);

  const freshInstanceResponse = await search(second.baseUrl);
  assert.equal(freshInstanceResponse.status, 200);
});
