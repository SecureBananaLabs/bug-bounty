import assert from "node:assert/strict";
import { test } from "node:test";

import { createNotification, listNotifications } from "../services/notificationService.js";

test("createNotification keeps id and read status server-owned", async () => {
  const created = await createNotification({
    id: "caller-controlled",
    read: true,
    message: "new event",
  });

  assert.match(created.id, /^ntf_\d+$/);
  assert.notEqual(created.id, "caller-controlled");
  assert.equal(created.read, false);
  assert.equal(created.message, "new event");

  const notifications = await listNotifications();
  assert.equal(notifications.at(-1), created);
});
