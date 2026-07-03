import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification preserves server-owned id and unread state", async () => {
  const notification = await createNotification({
    id: "attacker-id",
    read: true,
    message: "New proposal",
    type: "proposal"
  });

  assert.match(notification.id, /^ntf_/);
  assert.notEqual(notification.id, "attacker-id");
  assert.equal(notification.read, false);
  assert.equal(notification.message, "New proposal");
  assert.equal(notification.type, "proposal");
});
