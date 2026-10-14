import test from "node:test";
import assert from "node:assert/strict";
import { createNotification, listNotifications } from "../services/notificationService.js";

test("createNotification assigns a server-owned createdAt ISO timestamp", async () => {
  const before = Date.now();
  const notification = await createNotification({ message: "hello" });
  const after = Date.now();

  assert.ok(typeof notification.createdAt === "string", "createdAt should be a string");
  const parsed = Date.parse(notification.createdAt);
  assert.ok(!Number.isNaN(parsed), "createdAt should parse as a valid date");
  assert.ok(parsed >= before && parsed <= after, "createdAt should fall between before/after timestamps");
  assert.equal(notification.message, "hello");
  assert.equal(notification.read, false, "default read should be false");
});

test("createNotification ignores caller-supplied createdAt values", async () => {
  const notification = await createNotification({
    message: "world",
    createdAt: "1970-01-01T00:00:00.000Z",
  });
  const parsed = Date.parse(notification.createdAt);
  assert.ok(parsed > 0, "createdAt should reflect server time, not caller-supplied epoch zero");
  assert.notEqual(notification.createdAt, "1970-01-01T00:00:00.000Z");
});

test("createNotification returns the stored record via listNotifications", async () => {
  const initialLength = (await listNotifications()).length;
  const notification = await createNotification({ message: "stored" });
  const stored = await listNotifications();
  assert.equal(stored.length, initialLength + 1);
  assert.ok(stored.includes(notification));
});
