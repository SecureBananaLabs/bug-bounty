import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../services/messageService.js";

test("sendMessage preserves service-owned id and sentAt fields", async () => {
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

    assert.equal(message.id, "msg_1710000000000");
    assert.notEqual(message.sentAt, "2000-01-01T00:00:00.000Z");
    assert.equal(message.senderId, "usr_sender");
    assert.equal(message.recipientId, "usr_recipient");
    assert.equal(message.body, "Hello from the sender");
  } finally {
    Date.now = originalNow;
  }
});
