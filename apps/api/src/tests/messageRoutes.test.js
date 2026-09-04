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

test("POST /api/messages rejects an empty payload", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });

    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});

test("POST /api/messages rejects blank and malformed fields", async () => {
  await withServer(async (baseUrl) => {
    const blankContentResponse = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        senderId: "usr_sender",
        recipientId: "usr_recipient",
        content: "   "
      })
    });

    const malformedFieldResponse = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        senderId: 123,
        recipientId: "usr_recipient",
        content: "hello"
      })
    });

    const blankContentPayload = await blankContentResponse.json();
    const malformedFieldPayload = await malformedFieldResponse.json();

    assert.equal(blankContentResponse.status, 400);
    assert.equal(blankContentPayload.success, false);
    assert.equal(malformedFieldResponse.status, 400);
    assert.equal(malformedFieldPayload.success, false);
  });
});

test("POST /api/messages preserves the current success response shape for valid payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        senderId: "usr_sender",
        recipientId: "usr_recipient",
        content: "hello"
      })
    });

    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.senderId, "usr_sender");
    assert.equal(payload.data.recipientId, "usr_recipient");
    assert.equal(payload.data.content, "hello");
    assert.equal(typeof payload.data.id, "string");
    assert.equal(typeof payload.data.sentAt, "string");
  });
});

test("POST /api/messages trims surrounding whitespace from accepted fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        senderId: "  usr_sender  ",
        recipientId: "  usr_recipient  ",
        content: "  hello  "
      })
    });

    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.senderId, "usr_sender");
    assert.equal(payload.data.recipientId, "usr_recipient");
    assert.equal(payload.data.content, "hello");
  });
});
