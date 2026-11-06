import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification keeps server-owned id and unread state", async () => {
  const notification = await createNotification({
    id: "attacker-controlled-id",
    read: true,
    title: "Deployment finished",
  });

  assert.match(notification.id, /^ntf_\d+$/);
  assert.notEqual(notification.id, "attacker-controlled-id");
  assert.equal(notification.read, false);
  assert.equal(notification.title, "Deployment finished");
});
