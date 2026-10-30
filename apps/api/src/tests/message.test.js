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

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    return await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

test("POST /api/messages with valid payload returns 201 and creates message", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: "usr_alice_1",
        receiverId: "usr_bob_2",
        content: "Hello Bob, here is the updated milestone specification for review.",
        conversationId: "conv_12345"
      })
    });

    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.senderId, "usr_alice_1");
    assert.equal(body.data.receiverId, "usr_bob_2");
    assert.equal(body.data.content, "Hello Bob, here is the updated milestone specification for review.");
    assert.equal(body.data.conversationId, "conv_12345");
    assert.ok(body.data.id.startsWith("msg_"));
    assert.ok(body.data.sentAt);
  });
});

test("POST /api/messages with minimal valid payload (no optional conversationId) returns 201", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: "usr_alice_1",
        receiverId: "usr_bob_2",
        content: "Direct quick ping."
      })
    });

    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.senderId, "usr_alice_1");
    assert.equal(body.data.receiverId, "usr_bob_2");
  });
});

test("POST /api/messages rejects missing senderId with 400 Bad Request", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiverId: "usr_bob_2",
        content: "Ping"
      })
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "Validation failed");
    assert.ok(Array.isArray(body.issues));
  });
});

test("POST /api/messages rejects missing receiverId with 400 Bad Request", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: "usr_alice_1",
        content: "Ping"
      })
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "Validation failed");
  });
});

test("POST /api/messages rejects empty content string with 400", async () => {
  await withServer(async (baseUrl) => {
    for (const emptyContent of ["", "   "]) {
      const res = await fetch(`${baseUrl}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: "usr_alice_1",
          receiverId: "usr_bob_2",
          content: emptyContent
        })
      });

      const body = await res.json();
      assert.equal(res.status, 400);
      assert.equal(body.success, false);
      assert.equal(body.message, "Validation failed");
    }
  });
});

test("POST /api/messages rejects oversized content (>5000 chars) with 400", async () => {
  await withServer(async (baseUrl) => {
    const hugeContent = "x".repeat(5001);
    const res = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: "usr_alice_1",
        receiverId: "usr_bob_2",
        content: hugeContent
      })
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "Validation failed");
  });
});

test("POST /api/messages rejects extra unknown fields (strict schema) with 400", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: "usr_alice_1",
        receiverId: "usr_bob_2",
        content: "Legitimate text",
        maliciousInjection: "DROP TABLE users"
      })
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "Validation failed");
  });
});
