import test from "node:test";
import assert from "node:assert/strict";
import { createNotification, listNotifications } from "../services/notificationService.js";

test("createNotification keeps new notifications unread even if payload includes read", async () => {
  const notification = await createNotification({
    userId: "usr_notification_read_default",
    type: "message",
    message: "New proposal message",
    read: true
  });

  assert.equal(notification.read, false);

  const storedNotification = (await listNotifications()).find(
    (item) => item.id === notification.id
  );

  assert.equal(storedNotification?.read, false);
});
