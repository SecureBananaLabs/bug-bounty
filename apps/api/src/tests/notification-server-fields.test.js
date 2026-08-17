import test from "node:test";
import assert from "node:assert/strict";
import { createNotification, listNotifications } from "../services/notificationService.js";

test("notification id and read state cannot be overridden by payload", async () => {
  const before = (await listNotifications()).length;

  const result = await createNotification({
    userId: "usr_test",
    title: "Test notification",
    read: true,
    id: "ntf_evil"
  });

  // Server-owned fields must not reflect client input
  assert.equal(result.read, false, "read should always be false on creation");
  assert.ok(result.id.startsWith("ntf_"), "id should start with ntf_");
  assert.notEqual(result.id, "ntf_evil", "id should not be client-supplied value");

  // But user data should be preserved
  assert.equal(result.userId, "usr_test");
  assert.equal(result.title, "Test notification");
});

test("notification without override attempts works normally", async () => {
  const result = await createNotification({
    userId: "usr_normal",
    title: "Normal notification"
  });

  assert.equal(result.read, false);
  assert.ok(result.id.startsWith("ntf_"));
  assert.equal(result.userId, "usr_normal");
  assert.equal(result.title, "Normal notification");
});
