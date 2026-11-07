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

async function stopServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("malformed JSON is rejected with 400 before rate limit exhaustion", async () => {
  const server = await startServer();
  const { port } = server.address();

  try {
    const firstResponse = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: "{"
    });
    const firstPayload = await firstResponse.json();

    assert.equal(firstResponse.status, 400);
    assert.deepEqual(firstPayload, {
      success: false,
      message: "Invalid JSON payload"
    });

    let finalResponse;
    for (let i = 1; i < 201; i += 1) {
      finalResponse = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: "{"
      });
      await finalResponse.text();
    }

    assert.equal(finalResponse.status, 429);
  } finally {
    await stopServer(server);
  }
});
