import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification ignores caller-controlled id and read fields", async () => {
  const notification = await createNotification({
    id: "client-controlled-id",
    read: true,
    title: "Proposal update",
  });

  assert.match(notification.id, /^ntf_\d+$/);
  assert.notEqual(notification.id, "client-controlled-id");
  assert.equal(notification.read, false);
  assert.equal(notification.title, "Proposal update");
});
