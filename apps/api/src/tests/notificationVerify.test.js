import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification generated fields preservation", async () => {
  const payload = {
    userId: "usr_123",
    type: "alert",
    message: "New proposal received",
    id: "hacked_id",
    read: true
  };

  const notification = await createNotification(payload);

  assert.notEqual(notification.id, "hacked_id");
  assert.match(notification.id, /^ntf_/);
  assert.equal(notification.read, false);
});
