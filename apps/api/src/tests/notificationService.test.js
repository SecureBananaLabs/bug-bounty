import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("notification creation keeps id and unread state server-owned", async () => {
  const notification = await createNotification({
    id: "ntf_attacker",
    read: true,
    userId: "usr_123",
    message: "New proposal"
  });

  assert.notEqual(notification.id, "ntf_attacker");
  assert.match(notification.id, /^ntf_\d+_[0-9a-f-]{36}$/);
  assert.equal(notification.read, false);
  assert.equal(notification.userId, "usr_123");
  assert.equal(notification.message, "New proposal");
});

test("notification ids remain unique within the same millisecond", async () => {
  const originalNow = Date.now;
  Date.now = () => 1_725_000_000_000;

  try {
    const first = await createNotification({ message: "First" });
    const second = await createNotification({ message: "Second" });

    assert.match(first.id, /^ntf_1725000000000_[0-9a-f-]{36}$/);
    assert.match(second.id, /^ntf_1725000000000_[0-9a-f-]{36}$/);
    assert.notEqual(first.id, second.id);
    assert.equal(first.read, false);
    assert.equal(second.read, false);
  } finally {
    Date.now = originalNow;
  }
});
