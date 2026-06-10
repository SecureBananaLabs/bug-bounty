import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../services/messageService.js";

test("sendMessage preserves server-generated id over payload id", async () => {
  const message = await sendMessage({
    id: "fake_id",
    senderId: "sender_1",
    content: "hello"
  });

  assert.match(message.id, /^msg_/);
  assert.notEqual(message.id, "fake_id");
  assert.equal(message.senderId, "sender_1");
  assert.equal(message.content, "hello");
});
