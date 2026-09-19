import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification ignores caller-controlled id and read fields", async () => {
  const notification = await createNotification({
    id: "ntf_attacker",
    read: true,
    userId: "usr_123",
    title: "Payment received",
    body: "Your payment has cleared."
  });

  assert.notEqual(notification.id, "ntf_attacker");
  assert.equal(notification.read, false);
  assert.equal(notification.userId, "usr_123");
  assert.equal(notification.title, "Payment received");
});
