import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /health returns ok payload", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload, { ok: true, service: "api" });
  });
});

test("GET /health remains outside the shared API rate limit", async () => {
  await withServer(async (port) => {
    let lastHealthResponse;

    for (let attempt = 0; attempt < 205; attempt += 1) {
      lastHealthResponse = await fetch(`http://127.0.0.1:${port}/health`);
      assert.equal(lastHealthResponse.status, 200);
    }

    assert.equal(lastHealthResponse.headers.get("ratelimit"), null);
    assert.equal(lastHealthResponse.headers.get("ratelimit-policy"), null);

    const apiResponse = await fetch(`http://127.0.0.1:${port}/api/auth`);

    assert.equal(apiResponse.headers.get("ratelimit-policy"), "200;w=900");
    assert.match(apiResponse.headers.get("ratelimit"), /limit=200/);
  });
});
