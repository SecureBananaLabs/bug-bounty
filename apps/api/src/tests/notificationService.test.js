import test from "node:test";
import assert from "node:assert/strict";
import { createNotification, listNotifications } from "../services/notificationService.js";

test("createNotification adds a server-side createdAt timestamp", async () => {
  const notification = await createNotification({
    userId: "usr_123",
    title: "Proposal update",
    body: "A freelancer sent a proposal.",
    createdAt: "2000-01-01T00:00:00.000Z"
  });
  const notifications = await listNotifications();
  const storedNotification = notifications.find((candidate) => candidate.id === notification.id);

  assert.match(notification.createdAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.doesNotThrow(() => new Date(notification.createdAt).toISOString());
  assert.notEqual(notification.createdAt, "2000-01-01T00:00:00.000Z");
  assert.equal(storedNotification.createdAt, notification.createdAt);
});
