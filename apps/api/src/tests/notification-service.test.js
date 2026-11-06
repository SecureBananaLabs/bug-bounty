import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification preserves server-owned id and read state", async () => {
  const result = await createNotification({
    userId: "usr_1",
    type: "info",
    message: "hello",
    id: "ntf_attacker_supplied",
    read: true
  });

  assert.equal(result.userId, "usr_1");
  assert.equal(result.type, "info");
  assert.equal(result.message, "hello");
  assert.match(result.id, /^ntf_\d+$/);
  assert.notEqual(result.id, "ntf_attacker_supplied");
  assert.equal(result.read, false);
});
