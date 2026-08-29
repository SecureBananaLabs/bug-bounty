import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification ignores client-supplied read state", async () => {
  const notification = await createNotification({
    userId: "usr_1",
    title: "New proposal",
    read: true
  });

  assert.equal(notification.read, false);
});
