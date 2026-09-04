import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification keeps id and unread state server-owned", async () => {
  const notification = await createNotification({
    id: "caller-controlled",
    read: true,
    userId: "usr_123",
    message: "New proposal received"
  });

  assert.match(notification.id, /^ntf_\d+$/);
  assert.notEqual(notification.id, "caller-controlled");
  assert.equal(notification.read, false);
  assert.equal(notification.userId, "usr_123");
  assert.equal(notification.message, "New proposal received");
});
