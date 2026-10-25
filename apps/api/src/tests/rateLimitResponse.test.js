import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("rate limit responses use the API JSON error shape", async () => {
  await withServer(async (baseUrl) => {
    let response;

    for (let i = 0; i <= 200; i += 1) {
      response = await fetch(`${baseUrl}/health`);
    }

    const payload = await response.json();

    assert.equal(response.status, 429);
    assert.match(response.headers.get("content-type") ?? "", /^application\/json\b/);
    assert.deepEqual(payload, {
      success: false,
      message: "Too many requests"
    });
  });
});
