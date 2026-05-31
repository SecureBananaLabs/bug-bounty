import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification keeps notification metadata server-owned", async (t) => {
  const originalNow = Date.now;
  t.after(() => {
    Date.now = originalNow;
  });
  Date.now = () => 1700000000000;

  const notification = await createNotification({
    id: "ntf_client_supplied",
    read: true,
    message: "New proposal received"
  });

  assert.equal(notification.id, "ntf_1700000000000");
  assert.equal(notification.read, false);
});
