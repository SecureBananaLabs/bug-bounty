import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { env } from "../config/env.js";

async function requestHealth(origin) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await fetch(`http://127.0.0.1:${port}/health`, {
      headers: { origin }
    });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("CORS allows the configured frontend origin", async () => {
  const response = await requestHealth(env.corsOrigin);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), env.corsOrigin);
});

test("CORS does not allow untrusted browser origins", async () => {
  const response = await requestHealth("https://evil.example");

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), null);
});
