import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification preserves generated id and unread status", async () => {
  const originalNow = Date.now;
  Date.now = () => 1710000000000;

  try {
    const notification = await createNotification({
      id: "ntf_client_controlled",
      userId: "usr_recipient",
      type: "message",
      message: "You have a new message",
      read: true
    });

    assert.equal(notification.id, "ntf_1710000000000");
    assert.equal(notification.read, false);
    assert.equal(notification.userId, "usr_recipient");
    assert.equal(notification.type, "message");
    assert.equal(notification.message, "You have a new message");
  } finally {
    Date.now = originalNow;
  }
});
