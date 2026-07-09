import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification keeps id server-owned and starts unread", async () => {
  const notification = await createNotification({
    id: "client-notification-id",
    read: true,
    userId: "user_1",
    type: "message",
    message: "You have a new message"
  });

  assert.notEqual(notification.id, "client-notification-id");
  assert.equal(notification.read, false);
  assert.equal(notification.userId, "user_1");
  assert.equal(notification.message, "You have a new message");
});
