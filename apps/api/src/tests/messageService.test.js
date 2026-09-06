import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../services/messageService.js";

test("sendMessage keeps generated fields server-owned", async () => {
  const message = await sendMessage({
    id: "msg_client_supplied",
    senderId: "usr_sender",
    recipientId: "usr_recipient",
    body: "Hello from the sender"
  });

  assert.match(message.id, /^msg_\d+$/);
  assert.notEqual(message.id, "msg_client_supplied");
  assert.equal(message.senderId, "usr_sender");
  assert.equal(message.recipientId, "usr_recipient");
  assert.equal(message.body, "Hello from the sender");
  assert.equal(Number.isNaN(Date.parse(message.sentAt)), false);
});
