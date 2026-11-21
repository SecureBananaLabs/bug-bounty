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

test("createApp instances have isolated API rate-limit counters", async () => {
  const firstServer = await listen(createApp());
  const firstPort = firstServer.address().port;

  try {
    for (let request = 0; request < 200; request += 1) {
      const response = await fetch(`http://127.0.0.1:${firstPort}/api/search`);
      assert.equal(response.status, 200);
    }

    const limitedResponse = await fetch(`http://127.0.0.1:${firstPort}/api/search`);
    assert.equal(limitedResponse.status, 429);
  } finally {
    await close(firstServer);
  }

  const secondServer = await listen(createApp());
  const secondPort = secondServer.address().port;

  try {
    const response = await fetch(`http://127.0.0.1:${secondPort}/api/search`);
    assert.equal(response.status, 200);
  } finally {
    await close(secondServer);
  }
});
