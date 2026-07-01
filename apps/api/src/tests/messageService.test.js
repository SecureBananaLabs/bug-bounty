import test from "node:test";
import assert from "node:assert/strict";
import { listMessages, resetMessagesForTests, sendMessage } from "../services/messageService.js";

test.beforeEach(() => {
  resetMessagesForTests();
});

test("sendMessage stores server-owned defaults for new messages", async () => {
  const message = await sendMessage({
    conversationId: "conv_1",
    senderId: "usr_1",
    recipientId: "usr_2",
    body: "hello",
  });

  assert.match(message.id, /^msg_\d+$/);
  assert.equal(message.conversationId, "conv_1");
  assert.equal(message.senderId, "usr_1");
  assert.equal(message.recipientId, "usr_2");
  assert.equal(message.body, "hello");
  assert.equal(message.isRead, false);
  assert.equal(typeof message.createdAt, "string");
  assert.ok(Number.isFinite(Date.parse(message.createdAt)));
  assert.equal("sentAt" in message, false);

  const messages = await listMessages();
  assert.equal(messages.length, 1);
  assert.deepEqual(messages[0], message);
});

test("sendMessage ignores caller-owned read and timestamp fields", async () => {
  const message = await sendMessage({
    conversationId: "conv_2",
    senderId: "usr_3",
    recipientId: "usr_4",
    body: "secure defaults",
    isRead: true,
    sentAt: "2000-01-01T00:00:00.000Z",
    createdAt: "1999-01-01T00:00:00.000Z",
  });

  assert.equal(message.isRead, false);
  assert.notEqual(message.createdAt, "1999-01-01T00:00:00.000Z");
  assert.equal("sentAt" in message, false);
});
