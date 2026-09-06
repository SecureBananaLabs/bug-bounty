import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification preserves server-owned id and unread state", async () => {
  const notification = await createNotification({
    id: "client_forged_id",
    read: true,
    message: "hello",
  });

  assert.match(notification.id, /^ntf_\d+$/);
  assert.notEqual(notification.id, "client_forged_id");
  assert.equal(notification.read, false);
  assert.equal(notification.message, "hello");
});
