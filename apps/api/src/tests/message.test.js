import test from "node:test";
import assert from "node:assert/strict";
import { createMessageSchema } from "../validators/message.js";

test("createMessageSchema accepts valid payload", () => {
  const result = createMessageSchema.safeParse({
    senderId: "user1",
    receiverId: "user2",
    content: "Hello world!"
  });
  assert.equal(result.success, true);
});

test("createMessageSchema rejects missing content", () => {
  const result = createMessageSchema.safeParse({
    senderId: "user1",
    receiverId: "user2"
  });
  assert.equal(result.success, false);
});
