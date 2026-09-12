import test from "node:test";
import assert from "node:assert/strict";
import { createNotification, listNotifications } from "../services/notificationService.js";

test("listNotifications returns a defensive array copy", async () => {
  const notification = await createNotification({ message: "New proposal" });
  const listedNotifications = await listNotifications();

  listedNotifications.length = 0;

  const nextListedNotifications = await listNotifications();

  assert.equal(nextListedNotifications.length, 1);
  assert.equal(nextListedNotifications[0], notification);
});
