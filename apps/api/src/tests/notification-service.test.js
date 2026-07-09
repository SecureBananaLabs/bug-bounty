import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification preserves server-owned id and unread state", async () => {
  const notification = await createNotification({
    id: "client-controlled-id",
    read: true,
    type: "message",
    message: "New proposal received"
  });

  assert.match(notification.id, /^ntf_\d+$/);
  assert.notEqual(notification.id, "client-controlled-id");
  assert.equal(notification.read, false);
  assert.equal(notification.type, "message");
  assert.equal(notification.message, "New proposal received");
});

test("createNotification keeps normal payload fields", async () => {
  const notification = await createNotification({
    type: "job",
    message: "Job was updated"
  });

  assert.match(notification.id, /^ntf_\d+$/);
  assert.equal(notification.read, false);
  assert.equal(notification.type, "job");
  assert.equal(notification.message, "Job was updated");
});
