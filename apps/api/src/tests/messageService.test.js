import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../services/messageService.js";

test("sendMessage applies server-owned unread and createdAt fields", async () => {
  const message = await sendMessage({
    senderId: "usr_sender",
    receiverId: "usr_receiver",
    body: "hello"
  });

  assert.equal(message.senderId, "usr_sender");
  assert.equal(message.receiverId, "usr_receiver");
  assert.equal(message.body, "hello");
  assert.equal(message.isRead, false);
  assert.match(message.createdAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal("sentAt" in message, false);
});

test("sendMessage ignores caller-owned read and timestamp fields", async () => {
  const message = await sendMessage({
    senderId: "usr_sender",
    receiverId: "usr_receiver",
    body: "hello",
    isRead: true,
    sentAt: "2000-01-01T00:00:00.000Z",
    createdAt: "2000-01-01T00:00:00.000Z"
  });

  assert.equal(message.isRead, false);
  assert.notEqual(message.createdAt, "2000-01-01T00:00:00.000Z");
  assert.equal("sentAt" in message, false);
});
