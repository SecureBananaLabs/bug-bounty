import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification preserves server-owned id and read state", async () => {
  const notification = await createNotification({
    id: "attacker_supplied_id",
    userId: "usr_1",
    title: "Forged",
    body: "payload",
    read: true
  });

  assert.match(notification.id, /^ntf_\d+$/);
  assert.notEqual(notification.id, "attacker_supplied_id");
  assert.equal(notification.read, false);
  assert.equal(notification.userId, "usr_1");
  assert.equal(notification.title, "Forged");
  assert.equal(notification.body, "payload");
});
