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

  const { port } = server.address();

  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...options.headers
    }
  });

  return { response, payload: await response.json() };
}

test("POST /api/notifications rejects missing and blank messages", async () => {
  await withServer(async (baseUrl) => {
    const before = await requestJson(`${baseUrl}/api/notifications`);
    const invalidPayloads = [
      {},
      { message: "" },
      { message: "   " },
      { message: 123 },
      { message: false }
    ];

    for (const payload of invalidPayloads) {
      const result = await requestJson(`${baseUrl}/api/notifications`, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      assert.equal(result.response.status, 400);
      assert.deepEqual(result.payload, { success: false, message: "Invalid notification payload" });
    }

    const after = await requestJson(`${baseUrl}/api/notifications`);
    assert.equal(after.payload.data.length, before.payload.data.length);
  });
});

test("POST /api/notifications accepts valid messages", async () => {
  await withServer(async (baseUrl) => {
    const result = await requestJson(`${baseUrl}/api/notifications`, {
      method: "POST",
      body: JSON.stringify({
        userId: "usr_1",
        message: "A new update is ready"
      })
    });

    assert.equal(result.response.status, 201);
    assert.equal(result.payload.success, true);
    assert.match(result.payload.data.id, /^ntf_/);
    assert.equal(result.payload.data.userId, "usr_1");
    assert.equal(result.payload.data.message, "A new update is ready");
    assert.equal(result.payload.data.read, false);
  });
});
