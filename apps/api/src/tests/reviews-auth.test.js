import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

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

test("review routes reject anonymous requests", async () => {
  await withServer(async (baseUrl) => {
    const listResponse = await fetch(`${baseUrl}/api/reviews`);
    const listPayload = await listResponse.json();

    assert.equal(listResponse.status, 401);
    assert.deepEqual(listPayload, { success: false, message: "Unauthorized" });

    const createResponse = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rating: 5 })
    });
    const createPayload = await createResponse.json();

    assert.equal(createResponse.status, 401);
    assert.deepEqual(createPayload, { success: false, message: "Unauthorized" });
  });
});

test("review routes allow authenticated requests", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "user_1", role: "client" });
    const headers = {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    };

    const createResponse = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers,
      body: JSON.stringify({ rating: 5, comment: "great" })
    });
    const createPayload = await createResponse.json();

    assert.equal(createResponse.status, 201);
    assert.equal(createPayload.success, true);
    assert.equal(createPayload.data.rating, 5);

    const listResponse = await fetch(`${baseUrl}/api/reviews`, {
      headers: { authorization: `Bearer ${token}` }
    });
    const listPayload = await listResponse.json();

    assert.equal(listResponse.status, 200);
    assert.equal(listPayload.success, true);
    assert.equal(Array.isArray(listPayload.data), true);
    assert.equal(listPayload.data.length >= 1, true);
  });
});
