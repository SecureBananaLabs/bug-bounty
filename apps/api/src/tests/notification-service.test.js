import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification uses generated id and unread defaults", async (t) => {
  const originalNow = Date.now;

  Date.now = () => 1800000000000;
  t.after(() => {
    Date.now = originalNow;
  });

  const notification = await createNotification({
    id: "ntf_spoofed",
    read: true,
    userId: "usr_1",
    title: "Payment received"
  });

  assert.equal(notification.id, "ntf_1800000000000");
  assert.equal(notification.read, false);
  assert.equal(notification.userId, "usr_1");
  assert.equal(notification.title, "Payment received");
});
