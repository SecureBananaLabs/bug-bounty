import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification keeps id and read server-owned", async () => {
  const notification = await createNotification({
    id: "attacker_supplied",
    read: true,
    title: "New message",
    userId: "user_1"
  });

  assert.match(notification.id, /^ntf_\d+$/);
  assert.equal(notification.read, false);
  assert.equal(notification.title, "New message");
  assert.equal(notification.userId, "user_1");
});
