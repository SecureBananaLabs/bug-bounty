import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../services/messageService.js";

test("sendMessage ignores caller-supplied id and sentAt", async () => {
  const result = await sendMessage({ content: "Hello", recipientId: "usr_2", id: "evil-id", sentAt: "2000-01-01T00:00:00.000Z" });
  assert.notEqual(result.id, "evil-id");
  assert.notEqual(result.sentAt, "2000-01-01T00:00:00.000Z");
  assert.ok(result.id.startsWith("msg_"));
});
