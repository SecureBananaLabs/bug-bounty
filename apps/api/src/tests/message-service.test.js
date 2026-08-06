import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../services/messageService.js";

test("sendMessage ignores caller-supplied ids", async () => {
  const message = await sendMessage({
    id: "attacker-controlled-id",
    senderId: "user_1",
    recipientId: "user_2",
    body: "hello"
  });

  assert.match(message.id, /^msg_\d+$/);
  assert.notEqual(message.id, "attacker-controlled-id");
  assert.equal(message.senderId, "user_1");
  assert.equal(message.recipientId, "user_2");
  assert.equal(message.body, "hello");
  assert.equal(typeof message.sentAt, "string");
});
