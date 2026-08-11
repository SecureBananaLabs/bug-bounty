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
    await run(server.address().port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/messages rejects missing token", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/messages`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Unauthorized"
    });
  });
});

test("GET /api/messages only returns messages visible to the authenticated user", async () => {
  await withServer(async (port) => {
    const createMessage = async (payload) => {
      const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      assert.equal(response.status, 201);
      return (await response.json()).data;
    };

    const sentByAlice = await createMessage({
      senderId: "usr_alice",
      recipientId: "usr_bob",
      body: "Visible because Alice sent it"
    });
    const sentToAlice = await createMessage({
      senderId: "usr_carol",
      recipientId: "usr_alice",
      body: "Visible because Alice received it"
    });
    const hiddenFromAlice = await createMessage({
      senderId: "usr_dan",
      recipientId: "usr_erin",
      body: "Should stay hidden from Alice"
    });

    const token = signAccessToken({ sub: "usr_alice", role: "client" });
    const response = await fetch(`http://127.0.0.1:${port}/api/messages`, {
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);

    const returnedIds = payload.data.map((message) => message.id);
    assert.ok(returnedIds.includes(sentByAlice.id));
    assert.ok(returnedIds.includes(sentToAlice.id));
    assert.ok(!returnedIds.includes(hiddenFromAlice.id));
    assert.ok(
      payload.data.every(
        (message) =>
          message.senderId === "usr_alice" || message.recipientId === "usr_alice"
      )
    );
  });
});

test("GET /api/notifications rejects missing token", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/notifications`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Unauthorized"
    });
  });
});

test("GET /api/notifications only returns notifications owned by the authenticated user", async () => {
  await withServer(async (port) => {
    const createNotification = async (payload) => {
      const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      assert.equal(response.status, 201);
      return (await response.json()).data;
    };

    const visibleNotification = await createNotification({
      userId: "usr_alice",
      type: "message",
      text: "Visible to Alice"
    });
    const hiddenNotification = await createNotification({
      userId: "usr_bob",
      type: "message",
      text: "Should stay hidden from Alice"
    });

    const token = signAccessToken({ sub: "usr_alice", role: "client" });
    const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);

    const returnedIds = payload.data.map((notification) => notification.id);
    assert.ok(returnedIds.includes(visibleNotification.id));
    assert.ok(!returnedIds.includes(hiddenNotification.id));
    assert.ok(
      payload.data.every((notification) => notification.userId === "usr_alice")
    );
  });
});
