import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../services/messageService.js";

test("sendMessage ignores caller-supplied server-owned fields", async () => {
  const message = await sendMessage({
    id: "msg_attacker",
    senderId: "usr_sender",
    receiverId: "usr_receiver",
    body: "hello",
    sentAt: "1999-01-01T00:00:00.000Z"
  });

  assert.match(message.id, /^msg_\d+$/);
  assert.notEqual(message.id, "msg_attacker");
  assert.notEqual(message.sentAt, "1999-01-01T00:00:00.000Z");
  assert.equal(message.senderId, "usr_sender");
  assert.equal(message.receiverId, "usr_receiver");
  assert.equal(message.body, "hello");
});
