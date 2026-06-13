import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(assertions) {
  const app = createApp();
  const server = app.listen(0);

  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const { port } = server.address();
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("message routes reject unauthenticated requests", async () => {
  await withServer(async (baseUrl) => {
    for (const [method, body] of [
      ["GET", undefined],
      ["POST", JSON.stringify({ recipientId: "user_2", content: "Hello" })]
    ]) {
      const response = await fetch(`${baseUrl}/api/messages`, {
        method,
        headers: body ? { "content-type": "application/json" } : undefined,
        body
      });
      const payload = await response.json();

      assert.equal(response.status, 401);
      assert.deepEqual(payload, { success: false, message: "Unauthorized" });
    }
  });
});

test("message routes keep authenticated response behavior", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "user_1", role: "client" });
    const auth = { authorization: `Bearer ${token}` };

    const createResponse = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { ...auth, "content-type": "application/json" },
      body: JSON.stringify({ recipientId: "user_2", content: "Hello" })
    });
    const createPayload = await createResponse.json();

    assert.equal(createResponse.status, 201);
    assert.equal(createPayload.success, true);
    assert.match(createPayload.data.id, /^msg_\d+$/);
    assert.equal(createPayload.data.content, "Hello");

    const listResponse = await fetch(`${baseUrl}/api/messages`, { headers: auth });
    const listPayload = await listResponse.json();

    assert.equal(listResponse.status, 200);
    assert.equal(listPayload.success, true);
    assert.ok(Array.isArray(listPayload.data));
  });
});
