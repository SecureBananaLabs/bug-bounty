import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../services/messageService.js";

test("sendMessage keeps message id and timestamp server-owned", async () => {
  const message = await sendMessage({
    id: "msg_attacker",
    fromUserId: "usr_1",
    toUserId: "usr_2",
    body: "Hello",
    sentAt: "2000-01-01T00:00:00.000Z"
  });

  assert.match(message.id, /^msg_\d+$/);
  assert.notEqual(message.id, "msg_attacker");
  assert.notEqual(message.sentAt, "2000-01-01T00:00:00.000Z");
  assert.ok(!Number.isNaN(Date.parse(message.sentAt)));
  assert.equal(message.fromUserId, "usr_1");
  assert.equal(message.toUserId, "usr_2");
  assert.equal(message.body, "Hello");
});
