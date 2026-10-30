import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification ignores caller supplied id and read state", async () => {
  const notification = await createNotification({
    id: "ntf_attacker_controlled",
    read: true,
    message: "Hello",
  });

  assert.match(notification.id, /^ntf_\d+$/);
  assert.notEqual(notification.id, "ntf_attacker_controlled");
  assert.equal(notification.read, false);
  assert.equal(notification.message, "Hello");
});
