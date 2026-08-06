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

  return server;
}

async function closeServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("rate limited API requests return structured JSON errors", async () => {
  const server = await startServer();

  try {
    const { port } = server.address();
    const url = `http://127.0.0.1:${port}/api/users`;

    for (let i = 0; i < 200; i += 1) {
      const response = await fetch(url);
      assert.notEqual(response.status, 429);
    }

    const response = await fetch(url);
    const payload = await response.json();

    assert.equal(response.status, 429);
    assert.match(response.headers.get("content-type"), /application\/json/);
    assert.deepEqual(payload, {
      success: false,
      message: "Too many requests, please try again later."
    });
  } finally {
    await closeServer(server);
  }
});
