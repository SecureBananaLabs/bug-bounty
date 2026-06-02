import test from "node:test";
import assert from "node:assert/strict";
import { createNotification, listNotifications } from "../services/notificationService.js";

test("createNotification ignores caller-supplied id and read", async () => {
  const notification = await createNotification({ id: "custom", read: true, message: "hello" });
  assert.ok(notification.id.startsWith("ntf_"));
  assert.equal(notification.read, false);
  assert.equal(notification.message, "hello");
});

test("listNotifications preserves records when caller mutates returned array", async () => {
  const before = await listNotifications();
  before.push({ id: "injected" });
  const after = await listNotifications();
  const injected = after.find((item) => item.id === "injected");
  assert.equal(injected, undefined);
});
