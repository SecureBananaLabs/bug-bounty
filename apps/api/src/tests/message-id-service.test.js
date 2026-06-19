import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../services/messageService.js";

test("sendMessage ignores caller-controlled id", async () => {
  const originalNow = Date.now;
  Date.now = () => 6789;

  try {
    const message = await sendMessage({
      id: "caller_msg",
      fromUserId: "usr_1",
      toUserId: "usr_2",
      body: "Hello"
    });

    assert.equal(message.id, "msg_6789");
    assert.equal(message.body, "Hello");
    assert.ok(message.sentAt);
  } finally {
    Date.now = originalNow;
  }
});
