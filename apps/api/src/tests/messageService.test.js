import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../services/messageService.js";

test("sendMessage preserves server-owned id and sentAt fields", async () => {
  const message = await sendMessage({
    id: "client_supplied_id",
    sentAt: "2000-01-01T00:00:00.000Z",
    body: "Hello from the client",
    recipientId: "usr_recipient"
  });

  assert.match(message.id, /^msg_\d+$/);
  assert.notEqual(message.id, "client_supplied_id");
  assert.notEqual(message.sentAt, "2000-01-01T00:00:00.000Z");
  assert.equal(message.body, "Hello from the client");
  assert.equal(message.recipientId, "usr_recipient");
});
