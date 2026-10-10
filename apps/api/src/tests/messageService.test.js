import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../services/messageService.js";

test("sendMessage keeps id and sentAt server-owned", async () => {
  const suppliedId = "msg_attacker_controlled";
  const suppliedSentAt = "2099-01-01T00:00:00.000Z";

  const message = await sendMessage({
    id: suppliedId,
    sentAt: suppliedSentAt,
    content: "hello",
    receiverId: "usr_receiver",
  });

  assert.notEqual(message.id, suppliedId);
  assert.match(message.id, /^msg_\d+$/);
  assert.notEqual(message.sentAt, suppliedSentAt);
  assert.equal(message.content, "hello");
  assert.equal(message.receiverId, "usr_receiver");
});
