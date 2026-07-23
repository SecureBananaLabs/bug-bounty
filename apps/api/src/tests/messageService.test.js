import test from "node:test";
import assert from "node:assert/strict";
import { listMessages, sendMessage } from "../services/messageService.js";

test("sendMessage preserves server-owned id and sentAt fields", async () => {
  const message = await sendMessage({
    id: "msg_client_supplied",
    threadId: "thread-123",
    body: "Hello",
    sentAt: "1999-01-01T00:00:00.000Z"
  });

  assert.match(message.id, /^msg_\d+$/);
  assert.notEqual(message.id, "msg_client_supplied");
  assert.notEqual(message.sentAt, "1999-01-01T00:00:00.000Z");
  assert.equal(message.threadId, "thread-123");
  assert.equal(message.body, "Hello");
  assert.equal(Date.parse(message.sentAt) > 0, true);

  const storedMessages = await listMessages();
  assert.equal(storedMessages.at(-1), message);
});
