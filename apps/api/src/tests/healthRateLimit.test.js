import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(app) {
  const server = app.listen(0);

  return new Promise((resolve, reject) => {
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("GET /health remains available after API routes hit the rate limit", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    let apiResponse;
    for (let i = 0; i < 201; i += 1) {
      apiResponse = await fetch(`${baseUrl}/api/users`);
    }

    assert.equal(apiResponse.status, 429);

    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthPayload = await healthResponse.json();

    assert.equal(healthResponse.status, 200);
    assert.deepEqual(healthPayload, { ok: true, service: "api" });
  } finally {
    await close(server);
  }
});
