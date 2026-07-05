import test from "node:test";
import assert from "node:assert/strict";

import { createNotification, listNotifications } from "../services/notificationService.js";

test("createNotification generates unique server-owned ids for same-millisecond creates", async () => {
  const originalDateNow = Date.now;
  Date.now = () => 1720000000000;

  try {
    const first = await createNotification({ userId: "usr_a", message: "first" });
    const second = await createNotification({ userId: "usr_b", message: "second" });

    assert.match(first.id, /^ntf_[0-9a-f-]{36}$/);
    assert.match(second.id, /^ntf_[0-9a-f-]{36}$/);
    assert.notEqual(first.id, second.id);
  } finally {
    Date.now = originalDateNow;
  }
});

test("createNotification keeps id and read fields server-owned", async () => {
  const notification = await createNotification({
    id: "client-controlled",
    read: true,
    userId: "usr_c",
    message: "server fields should win",
  });

  assert.notEqual(notification.id, "client-controlled");
  assert.equal(notification.read, false);
  assert.equal(notification.userId, "usr_c");
  assert.equal(notification.message, "server fields should win");
  assert.ok((await listNotifications()).some((item) => item.id === notification.id));
});
