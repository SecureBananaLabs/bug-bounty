import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification keeps id and read state server-owned", async () => {
  const notification = await createNotification({
    id: "ntf_client_controlled",
    read: true,
    userId: "usr_123",
    type: "message",
    message: "You have a new message"
  });

  assert.match(notification.id, /^ntf_\d+$/);
  assert.notEqual(notification.id, "ntf_client_controlled");
  assert.equal(notification.read, false);
  assert.equal(notification.userId, "usr_123");
  assert.equal(notification.message, "You have a new message");
});
