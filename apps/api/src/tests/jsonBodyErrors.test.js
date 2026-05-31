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

test("malformed JSON request bodies return API 400 errors", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not-json"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Malformed JSON request body"
    });
  });
});

test("oversized JSON request bodies return API 413 errors", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ payload: "x".repeat(110_000) })
    });
    const payload = await response.json();

    assert.equal(response.status, 413);
    assert.deepEqual(payload, {
      success: false,
      message: "Request body too large"
    });
  });
});
