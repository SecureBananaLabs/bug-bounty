import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../services/messageService.js";

test("sendMessage preserves server-owned id and sentAt", async () => {
  const message = await sendMessage({
    id: "client_supplied_message_id",
    sentAt: "2000-01-01T00:00:00.000Z",
    body: "Can you review the project brief?",
    senderId: "usr_sender",
    receiverId: "usr_receiver",
  });

  assert.match(message.id, /^msg_\d+$/);
  assert.notEqual(message.id, "client_supplied_message_id");
  assert.notEqual(message.sentAt, "2000-01-01T00:00:00.000Z");
  assert.doesNotThrow(() => new Date(message.sentAt).toISOString());
  assert.equal(message.body, "Can you review the project brief?");
  assert.equal(message.senderId, "usr_sender");
  assert.equal(message.receiverId, "usr_receiver");
});
