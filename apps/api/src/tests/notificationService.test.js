import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification preserves server-owned id and unread state", async () => {
  const notification = await createNotification({
    id: "client_notification",
    userId: "usr_123",
    title: "Proposal update",
    body: "Your proposal received a reply",
    read: true
  });

  assert.match(notification.id, /^ntf_\d+$/);
  assert.notEqual(notification.id, "client_notification");
  assert.equal(notification.read, false);
  assert.equal(notification.userId, "usr_123");
  assert.equal(notification.title, "Proposal update");
  assert.equal(notification.body, "Your proposal received a reply");
});
