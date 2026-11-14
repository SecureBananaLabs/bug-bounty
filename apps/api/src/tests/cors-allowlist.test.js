process.env.CORS_ORIGINS = "https://allowed.example";

import test from "node:test";
import assert from "node:assert/strict";

const { createApp } = await import("../app.js");

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
    server.closeIdleConnections?.();
    server.closeAllConnections?.();
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /health allows a configured origin", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/health`, {
      headers: { Origin: "https://allowed.example" }
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), "https://allowed.example");
  });
});

test("GET /health ignores a disallowed origin without error", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/health`, {
      headers: { Origin: "https://bad.example" }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), null);
    assert.deepEqual(payload, { ok: true, service: "api" });
  });
});
