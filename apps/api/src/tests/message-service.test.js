import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../services/messageService.js";

test("sendMessage creates unread messages with schema timestamp", async () => {
  const message = await sendMessage({
    senderId: "usr_sender",
    receiverId: "usr_receiver",
    body: "Hello from the service test"
  });

  assert.equal(message.isRead, false);
  assert.equal("sentAt" in message, false);
  assert.match(message.createdAt, /^\d{4}-\d{2}-\d{2}T/);
});

test("sendMessage does not let callers mark new messages as read", async () => {
  const message = await sendMessage({
    senderId: "usr_sender",
    receiverId: "usr_receiver",
    body: "Keep unread until the receiver opens it",
    isRead: true
  });

  assert.equal(message.isRead, false);
});
