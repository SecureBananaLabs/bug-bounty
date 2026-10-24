import test from "node:test";
import assert from "node:assert/strict";
import { createNotification, listNotifications } from "../services/notificationService.js";

test("createNotification includes a server-owned createdAt timestamp", async () => {
  const notification = await createNotification({
    userId: "usr_client",
    message: "New proposal received",
    createdAt: "1999-01-01T00:00:00.000Z"
  });
  const notifications = await listNotifications();
  const storedNotification = notifications.find((candidate) => candidate.id === notification.id);

  assert.match(notification.id, /^ntf_/);
  assert.equal(notification.userId, "usr_client");
  assert.equal(notification.message, "New proposal received");
  assert.notEqual(notification.createdAt, "1999-01-01T00:00:00.000Z");
  assert.doesNotThrow(() => new Date(notification.createdAt).toISOString());
  assert.equal(storedNotification.createdAt, notification.createdAt);
});
