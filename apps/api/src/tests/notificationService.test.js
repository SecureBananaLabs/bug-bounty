import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification ignores caller supplied id and read state", async () => {
  const notification = await createNotification({
    id: "ntf_reserved",
    read: true,
    title: "Server-owned fields should win",
    message: "Client values must not override generated values",
  });

  assert.match(notification.id, /^ntf_\d+$/);
  assert.notEqual(notification.id, "ntf_reserved");
  assert.equal(notification.read, false);
  assert.equal(notification.title, "Server-owned fields should win");
  assert.equal(notification.message, "Client values must not override generated values");
});
