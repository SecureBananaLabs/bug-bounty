import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification ignores client-controlled id and read fields", async () => {
  const originalNow = Date.now;
  Date.now = () => 12345;

  try {
    const notification = await createNotification({
      id: "ntf_client",
      read: true,
      userId: "usr_1",
      message: "Proposal accepted"
    });

    assert.deepEqual(notification, {
      userId: "usr_1",
      message: "Proposal accepted",
      id: "ntf_12345",
      read: false
    });
  } finally {
    Date.now = originalNow;
  }
});
