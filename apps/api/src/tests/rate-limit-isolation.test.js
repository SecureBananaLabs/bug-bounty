import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function startServer() {
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

test("createApp instances do not share rate-limit counters", async () => {
  const firstServer = await startServer();
  const secondServer = await startServer();

  try {
    const firstPort = firstServer.address().port;
    const secondPort = secondServer.address().port;

    let lastResponse;
    for (let index = 0; index < 201; index += 1) {
      lastResponse = await fetch(`http://127.0.0.1:${firstPort}/health`);
    }

    assert.equal(lastResponse.status, 429);

    const secondResponse = await fetch(`http://127.0.0.1:${secondPort}/health`);
    const secondPayload = await secondResponse.json();

    assert.equal(secondResponse.status, 200);
    assert.deepEqual(secondPayload, { ok: true, service: "api" });
  } finally {
    await stopServer(firstServer);
    await stopServer(secondServer);
  }
});
