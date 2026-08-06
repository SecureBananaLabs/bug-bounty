import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../services/messageService.js";

test("sendMessage ignores caller-supplied ids", async () => {
  const message = await sendMessage({
    id: "client-controlled-id",
    body: "Hello",
    conversationId: "conv_1"
  });

  assert.match(message.id, /^msg_\d+$/);
  assert.notEqual(message.id, "client-controlled-id");
  assert.equal(message.body, "Hello");
  assert.equal(message.conversationId, "conv_1");
  assert.match(message.sentAt, /^\d{4}-\d{2}-\d{2}T/);
});