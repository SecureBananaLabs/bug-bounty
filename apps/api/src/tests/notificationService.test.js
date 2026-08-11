import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification preserves generated id and unread state", async () => {
  const notification = await createNotification({
    id: "ntf_client_supplied",
    title: "Proposal update",
    body: "A freelancer submitted a proposal.",
    read: true
  });

  assert.match(notification.id, /^ntf_\d+$/);
  assert.notEqual(notification.id, "ntf_client_supplied");
  assert.equal(notification.read, false);
});
