import test from "node:test";
import assert from "node:assert/strict";
import { createNotification, listNotifications } from "../services/notificationService.js";

test("createNotification keeps id and read state server-owned", async () => {
  const notification = await createNotification({
    id: "ntf_attacker",
    userId: "usr_123",
    title: "Proposal update",
    body: "You have a new proposal.",
    read: true
  });
  const storedNotification = (await listNotifications()).find(
    (candidate) => candidate.userId === notification.userId && candidate.title === notification.title
  );

  assert.match(notification.id, /^ntf_\d+$/);
  assert.notEqual(notification.id, "ntf_attacker");
  assert.equal(notification.read, false);
  assert.equal(notification.userId, "usr_123");
  assert.equal(notification.title, "Proposal update");
  assert.equal(storedNotification?.id, notification.id);
  assert.equal(storedNotification?.read, false);
});
