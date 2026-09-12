import test from "node:test";
import assert from "node:assert/strict";

import { listMessages, sendMessage } from "../services/messageService.js";

test("sendMessage generates unique server-owned ids for same-millisecond messages", async () => {
  const originalDateNow = Date.now;
  Date.now = () => 1720000000000;

  try {
    const first = await sendMessage({
      senderId: "usr_a",
      receiverId: "usr_b",
      body: "first",
    });
    const second = await sendMessage({
      senderId: "usr_c",
      receiverId: "usr_d",
      body: "second",
    });

    assert.match(first.id, /^msg_[0-9a-f-]{36}$/);
    assert.match(second.id, /^msg_[0-9a-f-]{36}$/);
    assert.notEqual(first.id, second.id);
  } finally {
    Date.now = originalDateNow;
  }
});

test("sendMessage keeps id and sentAt fields server-owned", async () => {
  const message = await sendMessage({
    id: "client-controlled",
    sentAt: "1999-01-01T00:00:00.000Z",
    senderId: "usr_e",
    receiverId: "usr_f",
    body: "server fields should win",
  });

  assert.notEqual(message.id, "client-controlled");
  assert.match(message.id, /^msg_[0-9a-f-]{36}$/);
  assert.notEqual(message.sentAt, "1999-01-01T00:00:00.000Z");
  assert.equal(message.senderId, "usr_e");
  assert.equal(message.receiverId, "usr_f");
  assert.equal(message.body, "server fields should win");
  assert.ok((await listMessages()).some((item) => item.id === message.id));
});
