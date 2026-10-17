import test from "node:test";
import assert from "node:assert/strict";
import { listMessages, sendMessage } from "../services/messageService.js";

test("sendMessage keeps generated ids server-owned", async () => {
  const message = await sendMessage({
    id: "msg_attacker",
    recipientId: "usr_recipient",
    jobId: "job_123",
    content: "Hello"
  });

  assert.match(message.id, /^msg_/);
  assert.notEqual(message.id, "msg_attacker");
  assert.equal(message.content, "Hello");
  assert.ok(message.sentAt);
});

test("listMessages returns a defensive array snapshot", async () => {
  const before = await listMessages();

  before.push({
    id: "msg_injected",
    recipientId: "usr_recipient",
    jobId: "job_123",
    content: "Injected"
  });

  const after = await listMessages();
  assert.equal(after.some((message) => message.id === "msg_injected"), false);
});

test("listMessages returns defensive record snapshots", async () => {
  const created = await sendMessage({
    recipientId: "usr_recipient",
    jobId: "job_123",
    content: "Original content"
  });

  const listed = await listMessages();
  const listedMessage = listed.find((message) => message.content === "Original content");
  listedMessage.content = "Mutated content";

  const listedAgain = await listMessages();

  assert.equal(listedAgain.some((message) => message.content === "Original content"), true);
  assert.equal(listedAgain.some((message) => message.content === "Mutated content"), false);
});

test("sendMessage returns a defensive record snapshot", async () => {
  const created = await sendMessage({
    recipientId: "usr_recipient",
    jobId: "job_123",
    content: "Returned snapshot"
  });
  created.content = "Mutated caller copy";

  const listed = await listMessages();

  assert.equal(listed.some((message) => message.content === "Returned snapshot"), true);
  assert.equal(listed.some((message) => message.content === "Mutated caller copy"), false);
});
