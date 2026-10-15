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

test("rate-limit rejection uses the shared JSON failure envelope", async () => {
  const server = await listen(createApp());

  try {
    const { port } = server.address();
    let response;
    for (let i = 0; i < 201; i += 1) {
      response = await fetch(`http://127.0.0.1:${port}/health`);
    }

    assert.equal(response.status, 429);
    assert.match(response.headers.get("content-type") ?? "", /^application\/json\b/);
    assert.deepEqual(await response.json(), {
      success: false,
      message: "Too many requests"
    });
  } finally {
    await close(server);
  }
});
