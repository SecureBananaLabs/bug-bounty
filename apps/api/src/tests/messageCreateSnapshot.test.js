import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage, listMessages } from "../services/messageService.js";

test("sendMessage returns a defensive snapshot", async () => {
  const created = await sendMessage({
    senderId: "sender_snapshot",
    recipientId: "recipient_snapshot",
    body: "Original message"
  });

  created.body = "Mutated message";
  created.senderId = "mutated_sender";

  const messages = await listMessages();

  assert.equal(messages.some((message) => message.body === "Mutated message"), false);
  assert.equal(messages.some((message) => message.senderId === "mutated_sender"), false);
  assert.equal(messages.some((message) => message.body === "Original message"), true);
});
