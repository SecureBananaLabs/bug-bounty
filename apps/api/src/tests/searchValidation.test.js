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

test("GET /api/search rejects overly long queries", async () => {
  await withServer(async (port) => {
    const q = "a".repeat(201);
    const response = await fetch(`http://127.0.0.1:${port}/api/search?q=${q}`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("GET /api/search trims and sanitizes accepted queries", async () => {
  await withServer(async (port) => {
    const q = encodeURIComponent("  <script>alert(1)</script> jobs  ");
    const response = await fetch(`http://127.0.0.1:${port}/api/search?q=${q}`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.query, "scriptalert(1)/script jobs");
  });
});
