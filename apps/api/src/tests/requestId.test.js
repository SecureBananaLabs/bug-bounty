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
    return await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => {
      server.close(() => resolve());
    });
  }
}

test("every response carries a generated x-request-id", async () => {
  await withServer(async (base) => {
    const first = await fetch(`${base}/health`);
    const second = await fetch(`${base}/health`);
    const firstId = first.headers.get("x-request-id");
    const secondId = second.headers.get("x-request-id");

    assert.equal(first.status, 200);
    assert.ok(firstId && firstId.length > 0);
    assert.notEqual(firstId, secondId);
  });
});

test("an inbound x-request-id is echoed back for tracing", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/health`, {
      headers: { "x-request-id": "trace-me-42" }
    });

    assert.equal(response.headers.get("x-request-id"), "trace-me-42");
  });
});
