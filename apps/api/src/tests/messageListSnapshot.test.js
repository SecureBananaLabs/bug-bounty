import assert from "node:assert/strict";
import test from "node:test";

import { listMessages, sendMessage } from "../services/messageService.js";

test("listMessages returns a snapshot that cannot mutate stored messages", async () => {
  const before = await listMessages();
  const message = await sendMessage({
    senderId: "usr_sender",
    receiverId: "usr_receiver",
    body: "Snapshot test message"
  });

  const listed = await listMessages();
  listed.length = 0;
  listed.push({
    id: "msg_attacker",
    senderId: "usr_attacker",
    receiverId: "usr_receiver",
    body: "Injected message",
    sentAt: new Date().toISOString()
  });

  const afterMutation = await listMessages();
  assert.equal(afterMutation.length, before.length + 1);
  assert.ok(afterMutation.some((item) => item.id === message.id));
  assert.equal(afterMutation.some((item) => item.id === "msg_attacker"), false);
});
