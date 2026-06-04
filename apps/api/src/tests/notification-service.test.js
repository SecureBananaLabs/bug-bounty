import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification preserves server-owned id and unread state", async () => {
  const notification = await createNotification({
    id: "ntf_attacker",
    read: true,
    userId: "user_1",
    message: "Your proposal was accepted",
  });

  assert.match(notification.id, /^ntf_\d+$/);
  assert.notEqual(notification.id, "ntf_attacker");
  assert.equal(notification.read, false);
  assert.equal(notification.userId, "user_1");
  assert.equal(notification.message, "Your proposal was accepted");
});
