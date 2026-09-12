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

  const { port } = server.address();
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/messages rejects anonymous clients", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/messages`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("POST /api/messages rejects anonymous clients", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: "hello" })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("authenticated clients can create and list messages", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_test", role: "client" });
    const headers = {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    };

    const createResponse = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify({ body: "authenticated message" })
    });
    const createPayload = await createResponse.json();

    assert.equal(createResponse.status, 201);
    assert.equal(createPayload.success, true);
    assert.equal(createPayload.data.body, "authenticated message");
    assert.match(createPayload.data.id, /^msg_/);
    assert.ok(createPayload.data.sentAt);

    const listResponse = await fetch(`${baseUrl}/api/messages`, {
      headers: { authorization: `Bearer ${token}` }
    });
    const listPayload = await listResponse.json();

    assert.equal(listResponse.status, 200);
    assert.equal(listPayload.success, true);
    assert.ok(
      listPayload.data.some((message) => message.id === createPayload.data.id),
      "created authenticated message should appear in the message list"
    );
  });
});
