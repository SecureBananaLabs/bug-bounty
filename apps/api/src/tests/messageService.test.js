import assert from "node:assert/strict";
import test from "node:test";

import { sendMessage } from "../services/messageService.js";

test("sendMessage keeps id server-owned", async () => {
  const message = await sendMessage({ id: "attacker-controlled", text: "hello" });

  assert.notEqual(message.id, "attacker-controlled");
  assert.match(message.id, /^msg_\d+_[0-9a-f-]{36}$/i);
  assert.equal(message.text, "hello");
});

test("sendMessage generates unique IDs for same-millisecond sends", async (t) => {
  const originalNow = Date.now;
  Date.now = () => 1234567890;
  t.after(() => {
    Date.now = originalNow;
  });

  const first = await sendMessage({ text: "first" });
  const second = await sendMessage({ text: "second" });

  assert.notEqual(first.id, second.id);
  assert.match(first.id, /^msg_1234567890_[0-9a-f-]{36}$/i);
  assert.match(second.id, /^msg_1234567890_[0-9a-f-]{36}$/i);
});
