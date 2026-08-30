import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../services/messageService.js";

test("sendMessage keeps IDs server-owned and unique", async () => {
  const originalDateNow = Date.now;
  Date.now = () => 1700000000000;

  try {
    const first = await sendMessage({
      id: "caller-controlled",
      senderId: "usr_1",
      recipientId: "usr_2",
      body: "Hello",
    });
    const second = await sendMessage({
      senderId: "usr_1",
      recipientId: "usr_2",
      body: "Again",
    });

    assert.match(first.id, /^msg_[0-9a-f-]{36}$/);
    assert.match(second.id, /^msg_[0-9a-f-]{36}$/);
    assert.notEqual(first.id, "caller-controlled");
    assert.notEqual(first.id, second.id);
    assert.equal(first.senderId, "usr_1");
    assert.equal(first.recipientId, "usr_2");
    assert.equal(first.body, "Hello");
    assert.ok(Number.isFinite(Date.parse(first.sentAt)));
  } finally {
    Date.now = originalDateNow;
  }
});
