import test from "node:test";
import assert from "node:assert/strict";
import {
  createNotification,
  listNotifications
} from "../services/notificationService.js";

test("createNotification keeps server-owned id and read state", async () => {
  const originalNow = Date.now;
  Date.now = () => 1700000000000;

  try {
    const notification = await createNotification({
      message: "Job proposal accepted",
      type: "proposal",
      userId: "usr_123",
      id: "client_supplied_id",
      read: true
    });

    assert.deepEqual(notification, {
      message: "Job proposal accepted",
      type: "proposal",
      userId: "usr_123",
      id: "ntf_1700000000000",
      read: false
    });

    const [storedNotification] = await listNotifications();
    assert.deepEqual(storedNotification, notification);
  } finally {
    Date.now = originalNow;
  }
});
