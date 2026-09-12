import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../services/messageService.js";

test("sendMessage keeps id and sentAt server-owned", async () => {
  const message = await sendMessage({
    id: "caller-controlled",
    sentAt: "2000-01-01T00:00:00.000Z",
    fromUserId: "usr_123",
    toUserId: "usr_456",
    body: "Hello from the marketplace"
  });

  assert.match(message.id, /^msg_\d+$/);
  assert.notEqual(message.id, "caller-controlled");
  assert.notEqual(message.sentAt, "2000-01-01T00:00:00.000Z");
  assert.doesNotThrow(() => new Date(message.sentAt).toISOString());
  assert.equal(message.fromUserId, "usr_123");
  assert.equal(message.toUserId, "usr_456");
  assert.equal(message.body, "Hello from the marketplace");
});
