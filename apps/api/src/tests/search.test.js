import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/search preserves a normal q string", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=alpha`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.query, "alpha");
  });
});

test("GET /api/search uses the first string for repeated q parameters", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=alpha&q=beta`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.query, "alpha");
  });
});

test("GET /api/search falls back to empty string for nested q values", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q[x]=beta`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.query, "");
  });
});

test("GET /api/search falls back to empty string when q is missing", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.query, "");
  });
});
