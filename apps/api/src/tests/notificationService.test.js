import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification protects generated id and unread state from payload overrides", async () => {
  const notification = await createNotification({
    id: "evil",
    read: true,
    userId: "usr_123",
    type: "message",
    message: "You have a new proposal."
  });

  assert.match(notification.id, /^ntf_\d+$/);
  assert.equal(notification.read, false);
  assert.equal(notification.userId, "usr_123");
});
