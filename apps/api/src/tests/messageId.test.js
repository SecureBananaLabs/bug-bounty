import test from "node:test";
import assert from "node:assert/strict";
import { listMessages, sendMessage } from "../services/messageService.js";

test("sendMessage gives every message a unique id in the same tick", async () => {
  const before = (await listMessages()).length;

  const first = await sendMessage({ senderId: "usr_a", recipientId: "usr_b", content: "one" });
  const second = await sendMessage({ senderId: "usr_a", recipientId: "usr_b", content: "two" });

  assert.match(first.id, /^msg_/);
  assert.notEqual(first.id, second.id);

  const messages = await listMessages();
  assert.equal(messages.length, before + 2);
  assert.deepEqual(
    new Set(messages.slice(before).map((message) => message.id)).size,
    2
  );
});
