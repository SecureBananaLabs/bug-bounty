import test from "node:test";
import assert from "node:assert/strict";
import {
  SelfMessageError,
  listMessages,
  sendMessage
} from "../services/messageService.js";

function messagePayload(overrides = {}) {
  const suffix = `${Date.now()}-${Math.random()}`;

  return {
    senderId: `usr_sender_${suffix}`,
    receiverId: `usr_receiver_${suffix}`,
    body: "Hello from the marketplace inbox.",
    ...overrides
  };
}

test("sendMessage rejects self-directed messages", async () => {
  const userId = `usr_self_${Date.now()}-${Math.random()}`;

  await assert.rejects(
    () => sendMessage(messagePayload({ senderId: userId, receiverId: userId })),
    SelfMessageError
  );

  const matchingMessages = (await listMessages()).filter(
    (message) => message.senderId === userId || message.receiverId === userId
  );

  assert.equal(matchingMessages.length, 0);
});

test("sendMessage allows messages between different users", async () => {
  const payload = messagePayload();
  const created = await sendMessage(payload);

  assert.equal(created.senderId, payload.senderId);
  assert.equal(created.receiverId, payload.receiverId);
  assert.notEqual(created.senderId, created.receiverId);
});
