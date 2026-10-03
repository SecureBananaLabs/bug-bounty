import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification preserves server-managed id and unread state", async () => {
  const result = await createNotification({
    id: "attacker-controlled-id",
    read: true,
    message: "Payment received"
  });

  assert.match(result.id, /^ntf_[0-9]+$/);
  assert.notEqual(result.id, "attacker-controlled-id");
  assert.equal(result.read, false);
  assert.equal(result.message, "Payment received");
});
