import test from "node:test";
import assert from "node:assert/strict";
import { createNotification, listNotifications } from "../services/notificationService.js";

test("createNotification preserves server-owned id and unread state", async () => {
  const notification = await createNotification({
    id: "malicious_caller_id",
    read: true,
    userId: "user_client_42",
    title: "Proposal accepted",
    body: "Your proposal for job-101 has been approved.",
  });

  assert.match(notification.id, /^ntf_\d+$/);
  assert.notEqual(notification.id, "malicious_caller_id");
  assert.equal(notification.read, false);
  assert.equal(notification.userId, "user_client_42");
  assert.equal(notification.title, "Proposal accepted");
  assert.equal(notification.body, "Your proposal for job-101 has been approved.");
});

test("listNotifications returns stored notifications", async () => {
  const all = await listNotifications();
  assert.ok(Array.isArray(all));
  assert.ok(all.length >= 1);
});
