import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification preserves server-owned id and unread state", async () => {
  const notification = await createNotification({
    id: "client_controlled_id",
    read: true,
    userId: "usr_123",
    message: "New proposal received"
  });

  assert.match(notification.id, /^ntf_\d+$/);
  assert.notEqual(notification.id, "client_controlled_id");
  assert.equal(notification.read, false);
  assert.equal(notification.userId, "usr_123");
  assert.equal(notification.message, "New proposal received");
});
