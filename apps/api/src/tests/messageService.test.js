import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../services/messageService.js";

test("sendMessage ignores client supplied server-owned fields", async () => {
  const originalNow = Date.now;
  Date.now = () => 1700000000000;

  try {
    const message = await sendMessage({
      id: "client_controlled_id",
      conversationId: "conv_123",
      senderId: "user_123",
      body: "hello",
      sentAt: "1999-01-01T00:00:00.000Z",
    });

    assert.equal(message.id, "msg_1700000000000");
    assert.notEqual(message.id, "client_controlled_id");
    assert.equal(message.conversationId, "conv_123");
    assert.equal(message.senderId, "user_123");
    assert.equal(message.body, "hello");
    assert.notEqual(message.sentAt, "1999-01-01T00:00:00.000Z");
    assert.match(message.sentAt, /^\d{4}-\d{2}-\d{2}T/);
  } finally {
    Date.now = originalNow;
  }
});
