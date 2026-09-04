import test from "node:test";
import assert from "node:assert/strict";
import {
  createNotification,
  listNotifications,
} from "../services/notificationService.js";

test("listNotifications returns a defensive snapshot", async () => {
  const created = await createNotification({ userId: "usr_1", message: "hello" });
  const listed = await listNotifications();

  listed.push({ id: "ntf_injected", userId: "usr_2" });

  const listedAgain = await listNotifications();

  assert.ok(
    listedAgain.some((notification) => notification.id === created.id),
  );
  assert.equal(
    listedAgain.some((notification) => notification.id === "ntf_injected"),
    false,
  );
});
