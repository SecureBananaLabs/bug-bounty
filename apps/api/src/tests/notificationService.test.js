import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification preserves generated fields over payload values", async () => {
  const notification = await createNotification({
    id: "client_supplied_id",
    read: true,
    message: "Proposal received"
  });

  assert.notEqual(notification.id, "client_supplied_id");
  assert.equal(notification.id.startsWith("ntf_"), true);
  assert.equal(notification.read, false);
  assert.equal(notification.message, "Proposal received");
});
