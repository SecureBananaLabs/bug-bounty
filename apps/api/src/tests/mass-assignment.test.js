import test from "node:test";
import assert from "node:assert";
import { createUser } from "../services/userService.js";
import { createNotification } from "../services/notificationService.js";

test("User Mass Assignment - cannot overwrite ID", async () => {
  const user = await createUser({ id: "hacked_user_id", name: "Alice" });
  assert.notStrictEqual(user.id, "hacked_user_id", "ID was overwritten by payload!");
});

test("Notification Mass Assignment - cannot overwrite ID and read status", async () => {
  const ntf = await createNotification({ id: "hacked_ntf", read: true, message: "Hello" });
  assert.notStrictEqual(ntf.id, "hacked_ntf", "Notification ID was overwritten by payload!");
  assert.strictEqual(ntf.read, false, "Notification read status was overwritten by payload!");
});
