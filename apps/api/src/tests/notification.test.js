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

test("POST /api/notifications rejects invalid creation payloads", async () => {
  await withServer(async (baseUrl) => {
    const before = await requestJson(`${baseUrl}/api/notifications`);
    const invalidPayloads = [
      {},
      { userId: "", title: "New proposal", body: "You have a new proposal" },
      { userId: "usr_1", title: "", body: "You have a new proposal" },
      { userId: "usr_1", title: "New proposal", body: "   " },
      { userId: "usr_1", title: "New proposal", body: 42 }
    ];

    for (const payload of invalidPayloads) {
      const result = await requestJson(`${baseUrl}/api/notifications`, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      assert.equal(result.response.status, 400);
      assert.equal(result.payload.success, false);
    }

    const after = await requestJson(`${baseUrl}/api/notifications`);
    assert.equal(after.payload.data.length, before.payload.data.length);
  });
});

test("POST /api/notifications preserves server-owned id and read defaults", async () => {
  await withServer(async (baseUrl) => {
    const result = await requestJson(`${baseUrl}/api/notifications`, {
      method: "POST",
      body: JSON.stringify({
        id: "ntf_client_supplied",
        userId: "usr_1",
        title: "New proposal",
        body: "You have a new proposal",
        read: true
      })
    });

    assert.equal(result.response.status, 201);
    assert.equal(result.payload.success, true);
    assert.match(result.payload.data.id, /^ntf_/);
    assert.notEqual(result.payload.data.id, "ntf_client_supplied");
    assert.equal(result.payload.data.read, false);
    assert.equal(result.payload.data.userId, "usr_1");
    assert.equal(result.payload.data.title, "New proposal");
    assert.equal(result.payload.data.body, "You have a new proposal");
  });
});
