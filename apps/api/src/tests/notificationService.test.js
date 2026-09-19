import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification owns id, read state, and createdAt timestamp", async () => {
  const before = Date.now();
  const notification = await createNotification({
    id: "attacker_id",
    read: true,
    createdAt: "2000-01-01T00:00:00.000Z",
    type: "message",
    message: "New message",
    recipientId: "user_1",
  });
  const after = Date.now();
  const createdAt = Date.parse(notification.createdAt);

  assert.match(notification.id, /^ntf_\d+$/);
  assert.equal(notification.read, false);
  assert.notEqual(notification.createdAt, "2000-01-01T00:00:00.000Z");
  assert.ok(createdAt >= before);
  assert.ok(createdAt <= after);
  assert.equal(notification.type, "message");
  assert.equal(notification.message, "New message");
  assert.equal(notification.recipientId, "user_1");
});
