import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../services/messageService.js";

test("Message sending ID preservation", async (t) => {
  await t.test("ignores client-supplied id", async () => {
    const message = await sendMessage({
      id: "custom_id_123",
      content: "Hello testing",
      senderId: "usr_1"
    });
    assert.match(message.id, /^msg_\d+$/);
    assert.notEqual(message.id, "custom_id_123");
  });

  await t.test("preserves other payload fields", async () => {
    const message = await sendMessage({
      id: "custom_id_123",
      content: "Important alert",
      senderId: "usr_2"
    });
    assert.equal(message.content, "Important alert");
    assert.equal(message.senderId, "usr_2");
    assert.ok(message.sentAt);
  });
});
