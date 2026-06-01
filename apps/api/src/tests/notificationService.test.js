import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification always starts unread with a server-owned id", async () => {
  const notification = await createNotification({ id: "ntf_client", read: true, message: "New proposal" });

  assert.match(notification.id, /^ntf_/);
  assert.notEqual(notification.id, "ntf_client");
  assert.equal(notification.read, false);
  assert.equal(notification.message, "New proposal");
});
