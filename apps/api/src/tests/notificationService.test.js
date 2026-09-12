import test from "node:test";
import assert from "node:assert/strict";
import { createNotification, listNotifications } from "../services/notificationService.js";

test("createNotification keeps createdAt server-generated", async () => {
  const title = `server-owned createdAt ${Date.now()}`;
  const clientCreatedAt = "2000-01-01T00:00:00.000Z";
  const notification = await createNotification({
    userId: "usr_recipient",
    title,
    body: "Notification timestamp should come from the service.",
    createdAt: clientCreatedAt
  });

  assert.equal(notification.userId, "usr_recipient");
  assert.equal(notification.title, title);
  assert.equal(notification.body, "Notification timestamp should come from the service.");
  assert.notEqual(notification.createdAt, clientCreatedAt);
  assert.equal(Number.isNaN(Date.parse(notification.createdAt)), false);

  const storedNotifications = await listNotifications();
  const storedNotification = storedNotifications.find((stored) => stored.title === title);

  assert.ok(storedNotification);
  assert.equal(storedNotification.createdAt, notification.createdAt);
});
