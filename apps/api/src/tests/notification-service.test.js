import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification preserves server-owned id and unread state", async () => {
  const notification = await createNotification({
    id: "client_id",
    userId: "usr_1",
    type: "message",
    message: "New message",
    read: true
  });

  assert.match(notification.id, /^ntf_\d+$/);
  assert.notEqual(notification.id, "client_id");
  assert.equal(notification.read, false);
  assert.equal(notification.userId, "usr_1");
  assert.equal(notification.type, "message");
  assert.equal(notification.message, "New message");
});
