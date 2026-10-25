import test from "node:test";
import assert from "node:assert/strict";
import { createNotification, listNotifications } from "../services/notificationService.js";

test("createNotification keeps server-owned id and read", async () => {
  const originalNow = Date.now;
  Date.now = () => 1700000001000;

  try {
    const notification = await createNotification({
      message: "New proposal submitted",
      userId: "user_123",
      id: "client_supplied_id",
      read: true,
    });

    assert.equal(notification.id, "ntf_1700000001000");
    assert.equal(notification.read, false);
    assert.equal(notification.message, "New proposal submitted");

    const [storedNotification] = await listNotifications();
    assert.equal(storedNotification.id, "ntf_1700000001000");
    assert.equal(storedNotification.read, false);
  } finally {
    Date.now = originalNow;
  }
});
