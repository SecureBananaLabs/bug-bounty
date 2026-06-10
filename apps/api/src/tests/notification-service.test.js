import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification preserves generated id and unread status", async () => {
  const notification = await createNotification({
    id: "ntf_client",
    read: true,
    title: "Welcome",
    text: "hello"
  });

  assert.match(notification.id, /^ntf_\d+$/);
  assert.equal(notification.read, false);
  assert.equal(notification.title, "Welcome");
  assert.equal(notification.text, "hello");
});
