import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function startApp() {
  const server = createApp().listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  return server;
}

async function stopServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("createApp isolates rate-limit counters per app instance", async () => {
  const firstServer = await startApp();
  const secondServer = await startApp();

  try {
    const firstPort = firstServer.address().port;
    const secondPort = secondServer.address().port;

    for (let requestCount = 0; requestCount < 200; requestCount += 1) {
      const response = await fetch(`http://127.0.0.1:${firstPort}/health`);
      assert.equal(response.status, 200);
    }

    const limitedResponse = await fetch(`http://127.0.0.1:${firstPort}/health`);
    assert.equal(limitedResponse.status, 429);

    const secondAppResponse = await fetch(`http://127.0.0.1:${secondPort}/health`);
    assert.equal(secondAppResponse.status, 200);
  } finally {
    await stopServer(firstServer);
    await stopServer(secondServer);
  }
});
