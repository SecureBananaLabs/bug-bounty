import test from "node:test";
import assert from "node:assert/strict";
import { listMessages, sendMessage } from "../services/messageService.js";

test("sendMessage preserves service-owned id and sentAt fields", async () => {
  const beforeCount = (await listMessages()).length;
  const originalNow = Date.now;
  Date.now = () => 1710000000000;

  try {
    const message = await sendMessage({
      id: "msg_client_controlled",
      senderId: "usr_sender",
      recipientId: "usr_recipient",
      body: "Hello from the sender",
      sentAt: "2000-01-01T00:00:00.000Z"
    });

    assert.match(message.id, /^msg_1710000000000_[0-9a-f-]{36}$/);
    assert.notEqual(message.id, "msg_client_controlled");
    assert.notEqual(message.sentAt, "2000-01-01T00:00:00.000Z");
    assert.equal(message.senderId, "usr_sender");
    assert.equal(message.recipientId, "usr_recipient");
    assert.equal(message.body, "Hello from the sender");

    const messages = await listMessages();
    assert.equal(messages.length, beforeCount + 1);
    assert.equal(messages[messages.length - 1], message);
  } finally {
    Date.now = originalNow;
  }
});

test("sendMessage generates unique ids for same-millisecond messages", async () => {
  const originalNow = Date.now;
  Date.now = () => 1710000000000;

  try {
    const created = await Promise.all(
      Array.from({ length: 20 }, (_, index) => sendMessage({ body: `Message ${index}` }))
    );
    const ids = created.map((message) => message.id);

    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) {
      assert.match(id, /^msg_1710000000000_[0-9a-f-]{36}$/);
    }
  } finally {
    Date.now = originalNow;
  }
});
