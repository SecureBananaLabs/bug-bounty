import test from "node:test";
import assert from "node:assert/strict";
import {
  createNotification,
  listNotifications
} from "../services/notificationService.js";

test("createNotification returns a defensive snapshot", async () => {
  const created = await createNotification({
    userId: "user_snapshot",
    message: "Original notification"
  });

  created.message = "Mutated notification";
  created.userId = "mutated_user";

  const notifications = await listNotifications();

  assert.equal(
    notifications.some((notification) => notification.message === "Mutated notification"),
    false
  );
  assert.equal(
    notifications.some((notification) => notification.userId === "mutated_user"),
    false
  );
  assert.equal(
    notifications.some((notification) => notification.message === "Original notification"),
    true
  );
});
