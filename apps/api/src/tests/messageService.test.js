import test from "node:test";
import assert from "node:assert/strict";
import { listMessages, sendMessage } from "../services/messageService.js";

test("sendMessage keeps message ids server-generated", async () => {
  const body = `server generated id ${Date.now()}`;
  const message = await sendMessage({
    id: "client_supplied_id",
    fromUserId: "usr_sender",
    toUserId: "usr_recipient",
    body
  });

  assert.match(message.id, /^msg_/);
  assert.notEqual(message.id, "client_supplied_id");
  assert.equal(message.fromUserId, "usr_sender");
  assert.equal(message.toUserId, "usr_recipient");
  assert.equal(message.body, body);

  const storedMessages = await listMessages();
  const storedMessage = storedMessages.find((stored) => stored.body === body);

  assert.ok(storedMessage);
  assert.equal(storedMessage.id, message.id);
});
