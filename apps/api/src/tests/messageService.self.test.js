import test from "node:test";
import assert from "node:assert/strict";
import { listMessages, MessageValidationError, sendMessage } from "../services/messageService.js";

test("sendMessage rejects self-directed messages without storing them", async () => {
  const before = await listMessages();

  await assert.rejects(
    () =>
      sendMessage({
        senderId: "usr_123",
        receiverId: "usr_123",
        body: "hello myself",
      }),
    MessageValidationError,
  );

  const after = await listMessages();
  assert.equal(after.length, before.length);
});
