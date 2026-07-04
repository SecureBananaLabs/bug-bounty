import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("Notification Field Preservation Service", async (t) => {
  await t.test("createNotification overrides client-supplied id and read values", async () => {
    const payload = {
      id: "custom_id_123",
      read: true,
      userId: "usr_1",
      message: "Test message"
    };

    const notification = await createNotification(payload);
    assert.notEqual(notification.id, "custom_id_123");
    assert.match(notification.id, /^ntf_/);
    assert.equal(notification.read, false);
    assert.equal(notification.userId, "usr_1");
  });
});
