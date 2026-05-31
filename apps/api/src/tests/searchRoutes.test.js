import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(assertion) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertion(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/search rejects overly long query strings", async () => {
  await withServer(async (baseUrl) => {
    const query = "a".repeat(101);
    const response = await fetch(`${baseUrl}/api/search?q=${query}`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Search query must be 100 characters or fewer");
  });
});

test("GET /api/search rejects repeated query parameters", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=one&q=two`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Search query must be a string");
  });
});
