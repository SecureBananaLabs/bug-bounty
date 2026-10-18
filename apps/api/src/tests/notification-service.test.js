import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification preserves generated id and unread state", async () => {
  const notification = await createNotification({
    id: "client-id",
    read: true,
    title: "Proposal update",
  });

  assert.match(notification.id, /^ntf_\d+$/);
  assert.equal(notification.read, false);
  assert.equal(notification.title, "Proposal update");
});
