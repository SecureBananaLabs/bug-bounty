import test from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";

test("createNotification ignores caller-supplied id and read state", async () => {
  const result = await createNotification({
    message: "Hello",
    id: "hacked-ntf",
    read: true
  });
  assert.notEqual(result.id, "hacked-ntf", "caller-supplied id must be ignored");
  assert.equal(result.read, false, "read state must always be server-assigned false");
  assert.ok(result.id.startsWith("ntf_"), "id should be server-generated");
});
