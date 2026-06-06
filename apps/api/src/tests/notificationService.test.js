import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification preserves server-owned id and unread state", async () => {
  const result = await createNotification({
    id: "client-controlled-id",
    read: true,
    message: "New proposal received"
  });

  assert.match(result.id, /^ntf_/);
  assert.notEqual(result.id, "client-controlled-id");
  assert.equal(result.read, false);
  assert.equal(result.message, "New proposal received");
});
