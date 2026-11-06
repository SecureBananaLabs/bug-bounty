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

async function postJson(baseUrl, body) {
  return fetch(`${baseUrl}/api/jobs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body
  });
}

test("malformed JSON requests return a 400 client error", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(baseUrl, "{bad json");
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Malformed JSON request body"
    });
  });
});

test("oversized JSON requests return a 413 client error", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(baseUrl, JSON.stringify({
      title: "Large body",
      description: "x".repeat(110 * 1024)
    }));
    const payload = await response.json();

    assert.equal(response.status, 413);
    assert.deepEqual(payload, {
      success: false,
      message: "Request body too large"
    });
  });
});
