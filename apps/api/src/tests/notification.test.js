import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification preserves server-owned id and unread state", async () => {
  const notification = await createNotification({
    id: "attacker-controlled-id",
    read: true,
    userId: "usr_123",
    message: "New proposal received"
  });

  assert.match(notification.id, /^ntf_\d+$/);
  assert.notEqual(notification.id, "attacker-controlled-id");
  assert.equal(notification.read, false);
  assert.equal(notification.userId, "usr_123");
  assert.equal(notification.message, "New proposal received");
});

test("createNotification creates unread notifications for normal payloads", async () => {
  const notification = await createNotification({
    userId: "usr_456",
    message: "Payment received"
  });

  assert.match(notification.id, /^ntf_\d+$/);
  assert.equal(notification.read, false);
  assert.equal(notification.userId, "usr_456");
  assert.equal(notification.message, "Payment received");
});
