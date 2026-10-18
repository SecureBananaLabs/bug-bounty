import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification keeps new notifications unread", async () => {
  const notification = await createNotification({
    userId: "usr_1",
    title: "New proposal",
    read: true
  });

  assert.match(notification.id, /^ntf_/);
  assert.equal(notification.userId, "usr_1");
  assert.equal(notification.title, "New proposal");
  assert.equal(notification.read, false);
});
