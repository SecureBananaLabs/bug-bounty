import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const { port } = server.address();
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/search treats omitted query as an empty safe search", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.query, "");
  });
});

test("GET /api/search trims query input before searching", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=%20%20freelancer%20%20`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.query, "freelancer");
  });
});

test("GET /api/search rejects queries longer than 200 characters", async () => {
  const longQuery = "a".repeat(201);

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=${longQuery}`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Search query must be 200 characters or fewer");
  });
});
