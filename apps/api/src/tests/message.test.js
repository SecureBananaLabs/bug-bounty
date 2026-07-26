import test from "node:test";
import assert from "node:assert/strict";

// Each test file gets a fresh module graph under node --test, so the
// in-memory `messages` array inside messageService is isolated per test.
const { sendMessage, listMessages } = await import("../services/messageService.js");

test("sendMessage assigns a unique id on every call", async () => {
  const a = await sendMessage({ body: "hello" });
  const b = await sendMessage({ body: "world" });
  assert.notEqual(a.id, b.id, "consecutive messages must not share an id");
  assert.match(a.id, /^msg_[0-9a-f-]{36}$/);
  assert.match(b.id, /^msg_[0-9a-f-]{36}$/);
});

test("sendMessage preserves the msg_ prefix", async () => {
  const m = await sendMessage({ body: "x" });
  assert.ok(m.id.startsWith("msg_"));
});

test("sendMessage stores payload fields and sentAt timestamp", async () => {
  const before = Date.now();
  const m = await sendMessage({ body: "hi", senderId: "u1", receiverId: "u2" });
  const after = Date.now();

  assert.equal(m.body, "hi");
  assert.equal(m.senderId, "u1");
  assert.equal(m.receiverId, "u2");
  assert.ok(typeof m.sentAt === "string");
  const sentAtMs = Date.parse(m.sentAt);
  assert.ok(sentAtMs >= before && sentAtMs <= after, "sentAt should fall within the call window");
});

test("sendMessage stays unique even when Date.now() is frozen at one millisecond", async () => {
  const realNow = Date.now;
  let frozen = 1_700_000_000_000;
  Date.now = () => frozen;

  try {
    const a = await sendMessage({ body: "first" });
    const b = await sendMessage({ body: "second" });
    const c = await sendMessage({ body: "third" });
    assert.notEqual(a.id, b.id);
    assert.notEqual(b.id, c.id);
    assert.notEqual(a.id, c.id);
  } finally {
    Date.now = realNow;
  }
});

