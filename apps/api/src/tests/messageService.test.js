import test from "node:test";
import assert from "node:assert/strict";
import { listMessages, sendMessage } from "../services/messageService.js";

test("sendMessage keeps id and sentAt server-owned while preserving message fields", async () => {
  const payload = {
    id: "client-chosen-id",
    sentAt: "client-chosen-time",
    senderId: "usr_sender",
    recipientId: "usr_recipient",
    body: "Hello",
  };
  const originalPayload = { ...payload };
  const before = Date.now();
  const message = await sendMessage(payload);
  const after = Date.now();

  assert.match(message.id, /^msg_\d+$/);
  const createdAt = Number(message.id.slice(4));
  assert.ok(createdAt >= before && createdAt <= after);
  assert.ok(Date.parse(message.sentAt) >= before && Date.parse(message.sentAt) <= after);
  assert.equal(message.senderId, payload.senderId);
  assert.equal(message.recipientId, payload.recipientId);
  assert.equal(message.body, payload.body);
  assert.deepEqual(payload, originalPayload);

  const stored = (await listMessages()).find((entry) => entry === message);
  assert.ok(stored);
  assert.equal(stored.id, message.id);
  assert.equal(stored.sentAt, message.sentAt);
});
