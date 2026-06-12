import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification preserves server-generated id and read state", async () => {
  const notification = await createNotification({
    id: "ntf_client_supplied",
    read: true,
    message: "Proposal accepted",
  });

  assert.match(notification.id, /^ntf_\d+$/);
  assert.notEqual(notification.id, "ntf_client_supplied");
  assert.equal(notification.read, false);
  assert.equal(notification.message, "Proposal accepted");
});
