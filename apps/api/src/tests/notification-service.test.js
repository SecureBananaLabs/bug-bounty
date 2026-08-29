import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification preserves server-owned id and read state", async () => {
  const notification = await createNotification({
    id: "client_supplied",
    read: true,
    message: "Proposal was accepted"
  });

  assert.match(notification.id, /^ntf_/);
  assert.notEqual(notification.id, "client_supplied");
  assert.equal(notification.read, false);
  assert.equal(notification.message, "Proposal was accepted");
});
