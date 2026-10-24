import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../services/messageService.js";

test("sendMessage ignores caller-owned id and sentAt fields", async () => {
  const message = await sendMessage({
    id: "msg_attacker_supplied",
    sentAt: "2000-01-01T00:00:00.000Z",
    senderId: "user_1",
    recipientId: "user_2",
    body: "hello",
  });

  assert.match(message.id, /^msg_\d+$/);
  assert.notEqual(message.id, "msg_attacker_supplied");
  assert.notEqual(message.sentAt, "2000-01-01T00:00:00.000Z");
  assert.equal(message.senderId, "user_1");
  assert.equal(message.recipientId, "user_2");
  assert.equal(message.body, "hello");
});
