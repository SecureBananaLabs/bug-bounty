import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../services/messageService.js";

test("sendMessage ignores caller supplied id", async () => {
  const message = await sendMessage({
    id: "msg_attacker_controlled",
    senderId: "usr_sender",
    recipientId: "usr_recipient",
    body: "Hello",
  });

  assert.match(message.id, /^msg_\d+$/);
  assert.notEqual(message.id, "msg_attacker_controlled");
  assert.equal(message.senderId, "usr_sender");
  assert.equal(message.recipientId, "usr_recipient");
  assert.equal(message.body, "Hello");
  assert.equal(typeof message.sentAt, "string");
});
