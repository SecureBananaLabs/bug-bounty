import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withTestServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/search trims valid query text", async () => {
  await withTestServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=%20React-UI%20`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.query, "React-UI");
  });
});

test("GET /api/search rejects repeated query parameters", async () => {
  await withTestServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=react&q=node`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.message, "Search query must be a single string");
  });
});

test("GET /api/search rejects overly long queries", async () => {
  await withTestServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=${"a".repeat(201)}`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.message, "Search query must be 200 characters or fewer");
  });
});

test("GET /api/search rejects unsupported characters", async () => {
  await withTestServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=%3Cscript%3E`);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.message, "Search query contains unsupported characters");
  });
});
