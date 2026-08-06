import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification preserves server-owned id and unread state", async () => {
  const notification = await createNotification({
    id: "caller-controlled",
    read: true,
    userId: "user_123",
    title: "Escrow update",
    body: "Payment released"
  });

  assert.match(notification.id, /^ntf_\d+$/);
  assert.notEqual(notification.id, "caller-controlled");
  assert.equal(notification.read, false);
  assert.equal(notification.userId, "user_123");
  assert.equal(notification.title, "Escrow update");
});
