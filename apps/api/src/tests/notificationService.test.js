import assert from "node:assert/strict";
import test from "node:test";

import { createNotification } from "../services/notificationService.js";

test("createNotification preserves server-owned id and unread state", async () => {
  const notification = await createNotification({
    id: "client_supplied",
    read: true,
    recipient: "usr_client",
    message: "Proposal received"
  });

  assert.match(notification.id, /^ntf_/);
  assert.notEqual(notification.id, "client_supplied");
  assert.equal(notification.read, false);
  assert.equal(notification.recipient, "usr_client");
  assert.equal(notification.message, "Proposal received");
});
