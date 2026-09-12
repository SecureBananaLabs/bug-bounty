import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(assertions) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/search rejects missing and empty search queries", async () => {
  await withServer(async (baseUrl) => {
    const missing = await fetch(`${baseUrl}/api/search`);
    const empty = await fetch(`${baseUrl}/api/search?q=%20%20`);
    const missingPayload = await missing.json();
    const emptyPayload = await empty.json();

    assert.equal(missing.status, 400);
    assert.equal(missingPayload.success, false);
    assert.equal(missingPayload.message, "Validation failed");
    assert.ok(missingPayload.errors.some((error) => error.path.includes("q")));

    assert.equal(empty.status, 400);
    assert.equal(emptyPayload.success, false);
    assert.equal(emptyPayload.message, "Validation failed");
    assert.ok(emptyPayload.errors.some((error) => error.path.includes("q")));
  });
});

test("GET /api/search rejects overly long search queries", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=${"x".repeat(101)}`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.ok(payload.errors.some((error) => error.path.includes("q")));
  });
});

test("GET /api/search passes trimmed valid search queries", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=%20react%20`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.query, "react");
    assert.deepEqual(payload.data.users, []);
    assert.deepEqual(payload.data.jobs, []);
    assert.deepEqual(payload.data.freelancers, []);
  });
});
