import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../services/messageService.js";

test("sendMessage ignores caller-supplied id", async () => {
  const message = await sendMessage({
    id: "attacker-controlled-id",
    body: "hello",
    senderId: "usr_1",
    recipientId: "usr_2"
  });

  assert.match(message.id, /^msg_\d+$/);
  assert.notEqual(message.id, "attacker-controlled-id");
  assert.equal(message.body, "hello");
  assert.equal(message.senderId, "usr_1");
  assert.equal(message.recipientId, "usr_2");
  assert.equal(typeof message.sentAt, "string");
});
