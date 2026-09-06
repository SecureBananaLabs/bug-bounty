import assert from "node:assert/strict";
import test from "node:test";
import { createNotification } from "../services/notificationService.js";

test("createNotification keeps server-owned fields", async () => {
  const notification = await createNotification({
    id: "client-id",
    read: true,
    message: "Hello",
    type: "info",
    userId: "usr_123"
  });

  assert.match(notification.id, /^ntf_/);
  assert.equal(notification.read, false);
  assert.equal(notification.message, "Hello");
  assert.equal(notification.type, "info");
  assert.equal(notification.userId, "usr_123");
});
