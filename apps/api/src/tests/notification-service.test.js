import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification preserves server-owned id and read state", async () => {
  const notification = await createNotification({
    message: "Build finished",
    type: "system",
    userId: "usr_notify",
    id: "ntf_attacker_supplied",
    read: true,
    ignored: "drop-me"
  });

  assert.equal(notification.message, "Build finished");
  assert.equal(notification.type, "system");
  assert.equal(notification.userId, "usr_notify");
  assert.match(notification.id, /^ntf_\d+$/);
  assert.notEqual(notification.id, "ntf_attacker_supplied");
  assert.equal(notification.read, false);
  assert.equal("ignored" in notification, false);
});
