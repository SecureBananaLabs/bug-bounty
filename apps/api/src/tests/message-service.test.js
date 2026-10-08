import assert from "node:assert/strict";
import test from "node:test";

import { sendMessage } from "../services/messageService.js";

test("sendMessage ignores caller-supplied ids", async () => {
  const message = await sendMessage({
    id: "msg_attacker",
    body: "Hello there",
    senderId: "usr_1",
    recipientId: "usr_2"
  });

  assert.notEqual(message.id, "msg_attacker");
  assert.match(message.id, /^msg_\d+$/);
  assert.equal(message.body, "Hello there");
  assert.equal(message.senderId, "usr_1");
  assert.equal(message.recipientId, "usr_2");
  assert.match(message.sentAt, /^\d{4}-\d{2}-\d{2}T/);
});
