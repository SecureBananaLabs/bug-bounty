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

async function getHealth(server) {
  const { port } = server.address();
  return fetch(`http://127.0.0.1:${port}/health`);
}

test("createApp instances do not share rate limit counters", async () => {
  const firstServer = await listen(createApp());
  const secondServer = await listen(createApp());

  try {
    for (let request = 0; request < 200; request += 1) {
      const response = await getHealth(firstServer);
      assert.equal(response.status, 200);
      await response.body?.cancel();
    }

    const limitedResponse = await getHealth(firstServer);
    assert.equal(limitedResponse.status, 429);
    await limitedResponse.body?.cancel();

    const isolatedResponse = await getHealth(secondServer);
    assert.equal(isolatedResponse.status, 200);
    await isolatedResponse.body?.cancel();
  } finally {
    await close(firstServer);
    await close(secondServer);
  }
});
