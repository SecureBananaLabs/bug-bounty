import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification preserves server-owned id and read fields", async () => {
  const notification = await createNotification({
    id: "client_supplied_id",
    read: true,
    message: "Proposal received",
  });

  assert.match(notification.id, /^ntf_\d+$/);
  assert.equal(notification.read, false);
  assert.equal(notification.message, "Proposal received");
});
