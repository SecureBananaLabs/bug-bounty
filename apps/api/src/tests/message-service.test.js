import test from "node:test";
import assert from "node:assert/strict";
import { listMessages, sendMessage } from "../services/messageService.js";

test("sendMessage creates unread schema-shaped messages", async () => {
  const before = Date.now();

  const message = await sendMessage({
    senderId: "usr_sender",
    receiverId: "usr_receiver",
    body: "hello",
  });

  assert.equal(message.senderId, "usr_sender");
  assert.equal(message.receiverId, "usr_receiver");
  assert.equal(message.body, "hello");
  assert.equal(message.isRead, false);
  assert.equal("sentAt" in message, false);

  const createdAt = Date.parse(message.createdAt);
  assert.ok(Number.isFinite(createdAt));
  assert.ok(createdAt >= before);
  assert.ok(createdAt <= Date.now());
});

test("sendMessage ignores caller-controlled read and sent timestamp fields", async () => {
  const message = await sendMessage({
    senderId: "usr_sender",
    receiverId: "usr_receiver",
    body: "client override attempt",
    isRead: true,
    sentAt: "1999-01-01T00:00:00.000Z",
  });

  assert.equal(message.isRead, false);
  assert.equal("sentAt" in message, false);
  assert.match(message.createdAt, /^\d{4}-\d{2}-\d{2}T/);

  const storedMessages = await listMessages();
  const stored = storedMessages.at(-1);

  assert.equal(stored.id, message.id);
  assert.equal(stored.isRead, false);
  assert.equal("sentAt" in stored, false);
});
