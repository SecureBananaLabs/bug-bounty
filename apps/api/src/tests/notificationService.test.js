import test from "node:test";
import assert from "node:assert/strict";

import { createNotification } from "../services/notificationService.js";

test("createNotification preserves server-owned id and read state", async () => {
  const notification = await createNotification({
    id: "attacker-controlled-id",
    read: true,
    message: "Invoice paid",
    type: "billing",
    userId: "usr_123",
    injected: true
  });

  assert.match(notification.id, /^ntf_/);
  assert.notEqual(notification.id, "attacker-controlled-id");
  assert.equal(notification.read, false);
  assert.equal(notification.message, "Invoice paid");
  assert.equal(notification.type, "billing");
  assert.equal(notification.userId, "usr_123");
  assert.equal("injected" in notification, false);
});
