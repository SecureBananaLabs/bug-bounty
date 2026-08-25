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
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function sendMalformedJson(baseUrl) {
  return fetch(`${baseUrl}/api/jobs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{bad json"
  });
}

test("malformed JSON requests count toward the API rate limit", async () => {
  await withServer(async (baseUrl) => {
    const firstResponse = await sendMalformedJson(baseUrl);
    const firstPayload = await firstResponse.json();

    assert.equal(firstResponse.status, 400);
    assert.deepEqual(firstPayload, {
      success: false,
      message: "Malformed JSON payload"
    });

    let lastResponse = firstResponse;
    for (let requestCount = 2; requestCount <= 201; requestCount += 1) {
      lastResponse = await sendMalformedJson(baseUrl);
    }

    assert.equal(lastResponse.status, 429);
  });
});
