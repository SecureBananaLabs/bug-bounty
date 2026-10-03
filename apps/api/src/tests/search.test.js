import assert from "node:assert/strict";
import test from "node:test";
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
    return await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/search rejects repeated q values", async () => {
  await withServer(async (port) => {
    const response = await fetch(
      `http://127.0.0.1:${port}/api/search?q=hello&q=world`
    );
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /single string/i);
  });
});

test("GET /api/search trims and caps the query", async () => {
  await withServer(async (port) => {
    const input = `  ${"x".repeat(250)}  `;
    const response = await fetch(
      `http://127.0.0.1:${port}/api/search?q=${encodeURIComponent(input)}`
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.query, "x".repeat(200));
  });
});
