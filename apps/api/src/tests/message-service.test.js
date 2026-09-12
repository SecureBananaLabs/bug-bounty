import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../services/messageService.js";

test("sendMessage preserves the server-generated message id", async () => {
  const message = await sendMessage({
    id: "client_supplied",
    senderId: "usr_sender",
    recipientId: "usr_recipient",
    body: "Hello"
  });

  assert.match(message.id, /^msg_\d+$/);
  assert.notEqual(message.id, "client_supplied");
  assert.equal(message.senderId, "usr_sender");
  assert.equal(message.recipientId, "usr_recipient");
  assert.equal(message.body, "Hello");
  assert.match(message.sentAt, /^\d{4}-\d{2}-\d{2}T/);
});
