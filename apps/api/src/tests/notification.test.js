import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification starts notifications unread by default", async () => {
  const notification = await createNotification({
    message: "Welcome",
    type: "system",
    userId: "usr_1",
  });

  assert.equal(notification.read, false);
  assert.equal(notification.message, "Welcome");
  assert.equal(notification.type, "system");
  assert.equal(notification.userId, "usr_1");
});

test("createNotification ignores caller supplied read state", async () => {
  const notification = await createNotification({
    message: "Welcome",
    read: true,
    userId: "usr_2",
  });

  assert.equal(notification.read, false);
  assert.equal(notification.message, "Welcome");
  assert.equal(notification.userId, "usr_2");
});
