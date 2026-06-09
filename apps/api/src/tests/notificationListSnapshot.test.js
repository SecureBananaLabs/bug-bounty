import assert from "node:assert/strict";
import test from "node:test";

import { createNotification, listNotifications } from "../services/notificationService.js";

test("listNotifications returns a snapshot that cannot mutate stored notifications", async () => {
  const before = await listNotifications();
  const notification = await createNotification({
    userId: "usr_snapshot",
    type: "proposal",
    message: "A proposal was submitted."
  });

  const listed = await listNotifications();
  listed.length = 0;
  listed.push({
    id: "ntf_attacker",
    userId: "usr_attacker",
    type: "system",
    message: "Injected notification",
    read: true
  });

  const afterMutation = await listNotifications();
  assert.equal(afterMutation.length, before.length + 1);
  assert.ok(afterMutation.some((item) => item.id === notification.id));
  assert.equal(afterMutation.some((item) => item.id === "ntf_attacker"), false);
});
