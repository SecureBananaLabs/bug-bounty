import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification ignores caller-controlled internal fields", async () => {
  const originalNow = Date.now;
  Date.now = () => 1234;

  try {
    const notification = await createNotification({
      id: "caller_id",
      read: true,
      userId: "usr_1",
      message: "New proposal"
    });

    assert.equal(notification.id, "ntf_1234");
    assert.equal(notification.read, false);
    assert.equal(notification.userId, "usr_1");
    assert.equal(notification.message, "New proposal");
  } finally {
    Date.now = originalNow;
  }
});
