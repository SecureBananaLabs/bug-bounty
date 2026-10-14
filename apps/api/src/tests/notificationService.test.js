import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification strips caller-supplied id", async () => {
  const result = await createNotification({ id: "caller-id-123", message: "Hello" });
  assert.ok(!result.id.startsWith("caller-"), "Server should generate its own id, not use caller-supplied id");
  assert.ok(result.id.startsWith("ntf_"), "Server-generated id should start with ntf_");
});

test("createNotification strips caller-supplied read state", async () => {
  const result = await createNotification({ read: true, message: "Hello" });
  assert.equal(result.read, false, "New notifications should always be unread");
});

test("createNotification preserves other payload fields", async () => {
  const result = await createNotification({ message: "Test message", userId: "usr_1" });
  assert.equal(result.message, "Test message");
  assert.equal(result.userId, "usr_1");
  assert.equal(result.read, false);
});

test("createNotification always sets read to false regardless of caller payload", async () => {
  const a = await createNotification({ read: true, message: "A" });
  const b = await createNotification({ read: true, message: "B" });
  assert.equal(a.read, false);
  assert.equal(b.read, false);
  assert.ok(a.id.startsWith("ntf_"));
  assert.ok(b.id.startsWith("ntf_"));
});
