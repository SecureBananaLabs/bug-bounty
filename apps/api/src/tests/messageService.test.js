import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage, listMessages } from "../services/messageService.js";

test("sendMessage generates server-owned id", async () => {
  const result = await sendMessage({ text: "Hello", senderId: "user1" });
  assert.ok(result.id.startsWith("msg_"));
  assert.equal(result.text, "Hello");
  assert.equal(result.senderId, "user1");
  assert.ok(result.sentAt);
});

test("sendMessage ignores client-provided id", async () => {
  const result = await sendMessage({ id: "fake_id_123", text: "Test" });
  assert.notEqual(result.id, "fake_id_123");
  assert.ok(result.id.startsWith("msg_"));
});

test("sendMessage returns snapshot (not reference)", async () => {
  const result = await sendMessage({ text: "Snapshot test" });
  result.text = "MUTATED";
  
  const messages = await listMessages();
  const original = messages.find(m => m.id === result.id);
  assert.equal(original.text, "Snapshot test");
});

test("listMessages returns shallow copy", async () => {
  await sendMessage({ text: "Copy test" });
  const messages = await listMessages();
  const originalLength = messages.length;
  
  messages.push({ id: "injected", text: "injected" });
  
  const messagesAgain = await listMessages();
  assert.equal(messagesAgain.length, originalLength);
});

console.log("All message service tests passed!");
