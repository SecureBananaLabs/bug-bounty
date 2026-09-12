import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification always starts unread with a server-owned id and preserves payload", async () => {
  const notification = await createNotification({
    id: "ntf_client_supplied",
    read: true,
    userId: "usr_1",
    message: "New proposal",
    type: "proposal"
  });

  assert.notEqual(notification.id, "ntf_client_supplied");
  assert.match(notification.id, /^ntf_\d+$/);
  assert.equal(notification.read, false);
  assert.equal(notification.userId, "usr_1");
  assert.equal(notification.message, "New proposal");
  assert.equal(notification.type, "proposal");
});

test("createNotification ignores attempts to create already-read notifications", async () => {
  const notification = await createNotification({
    read: true,
    message: "Security alert"
  });

  assert.equal(notification.read, false);
  assert.match(notification.id, /^ntf_\d+$/);
});
