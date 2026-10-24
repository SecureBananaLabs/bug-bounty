import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification starts new notifications unread", async () => {
  const notification = await createNotification({
    message: "Welcome to FreelanceFlow",
    type: "system"
  });

  assert.equal(notification.read, false);
  assert.equal(notification.message, "Welcome to FreelanceFlow");
  assert.equal(notification.type, "system");
  assert.match(notification.id, /^ntf_\d+$/);
});

test("createNotification ignores caller supplied read state", async () => {
  const notification = await createNotification({
    message: "New proposal received",
    read: true
  });

  assert.equal(notification.read, false);
  assert.equal(notification.message, "New proposal received");
});
