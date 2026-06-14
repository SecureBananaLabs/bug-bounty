import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification preserves server-owned id and unread state", async () => {
  const originalNow = Date.now;
  Date.now = () => 123_456;

  try {
    const notification = await createNotification({
      id: "client_supplied",
      read: true,
      title: "New proposal",
    });

    assert.equal(notification.id, "ntf_123456");
    assert.equal(notification.read, false);
    assert.equal(notification.title, "New proposal");
  } finally {
    Date.now = originalNow;
  }
});
