import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification ignores caller-supplied id and read fields", async () => {
  const originalNow = Date.now;
  Date.now = () => 1700000000000;

  try {
    const notification = await createNotification({
      id: "ntf_attacker",
      read: true,
      userId: "usr_1",
      message: "New proposal received",
      type: "proposal"
    });

    assert.equal(notification.id, "ntf_1700000000000");
    assert.equal(notification.read, false);
    assert.equal(notification.userId, "usr_1");
    assert.equal(notification.message, "New proposal received");
    assert.equal(notification.type, "proposal");
  } finally {
    Date.now = originalNow;
  }
});
