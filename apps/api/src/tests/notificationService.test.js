import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification ignores caller-controlled internal fields", async () => {
  const notification = await createNotification({
    id: "caller_id",
    read: true,
    title: "New proposal",
    message: "A freelancer sent a proposal."
  });

  assert.match(notification.id, /^ntf_\d+$/);
  assert.notEqual(notification.id, "caller_id");
  assert.equal(notification.read, false);
  assert.equal(notification.title, "New proposal");
  assert.equal(notification.message, "A freelancer sent a proposal.");
});
