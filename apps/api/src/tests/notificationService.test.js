import assert from "node:assert/strict";
import test from "node:test";

import { createNotification } from "../services/notificationService.js";

test("createNotification ignores caller-supplied id", async () => {
  const notification = await createNotification({
    id: "ntf_client_supplied",
    message: "Proposal received"
  });

  assert.match(notification.id, /^ntf_\d+$/);
  assert.notEqual(notification.id, "ntf_client_supplied");
});

test("createNotification always starts unread", async () => {
  const notification = await createNotification({
    message: "Invoice paid",
    read: true
  });

  assert.equal(notification.read, false);
});

test("createNotification preserves caller-owned fields", async () => {
  const notification = await createNotification({
    message: "New milestone",
    type: "project"
  });

  assert.equal(notification.message, "New milestone");
  assert.equal(notification.type, "project");
});
