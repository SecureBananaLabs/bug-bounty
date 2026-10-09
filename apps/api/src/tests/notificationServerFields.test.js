import test from "node:test";
import assert from "node:assert/strict";
import { createNotification, listNotifications } from "../services/notificationService.js";

test("generated notification id wins over a caller supplied one", async () => {
  const created = await createNotification({
    id: "caller-owned",
    recipientId: "usr_53",
    message: "Invoice approved"
  });

  assert.match(created.id, /^ntf_\d+$/);
  assert.equal(created.recipientId, "usr_53");
  assert.equal(created.message, "Invoice approved");

  const listed = await listNotifications();
  assert.ok(listed.some((item) => item.id === created.id));
});

test("notifications start unread even when the payload claims otherwise", async () => {
  const created = await createNotification({
    read: true,
    recipientId: "usr_54",
    message: "Payment received"
  });

  assert.equal(created.read, false);
  assert.equal(created.message, "Payment received");
});
