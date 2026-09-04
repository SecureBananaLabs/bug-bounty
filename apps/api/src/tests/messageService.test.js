import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../services/messageService.js";

test("sendMessage keeps message ids server-generated", async () => {
  const before = Date.now();
  const message = await sendMessage({
    id: "attacker_id",
    senderId: "user_1",
    recipientId: "user_2",
    content: "Hello",
  });
  const after = Date.now();
  const sentAt = Date.parse(message.sentAt);

  assert.match(message.id, /^msg_\d+$/);
  assert.notEqual(message.id, "attacker_id");
  assert.ok(sentAt >= before);
  assert.ok(sentAt <= after);
  assert.equal(message.senderId, "user_1");
  assert.equal(message.recipientId, "user_2");
  assert.equal(message.content, "Hello");
});
