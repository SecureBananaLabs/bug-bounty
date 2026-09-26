import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification keeps id and read state server-owned", async () => {
  const notification = await createNotification({
    id: "ntf_client_supplied",
    userId: "usr_123",
    type: "message",
    title: "New message",
    read: true
  });

  assert.match(notification.id, /^ntf_\d+$/);
  assert.equal(notification.read, false);
  assert.equal(notification.userId, "usr_123");
  assert.equal(notification.type, "message");
  assert.equal(notification.title, "New message");
});
