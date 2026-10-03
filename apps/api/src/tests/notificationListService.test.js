import test from "node:test";
import assert from "node:assert/strict";
import { createNotification, listNotifications } from "../services/notificationService.js";

test("listNotifications returns defensive snapshots", async () => {
  await createNotification({
    userId: "usr_snapshot",
    message: "Snapshot notification",
    type: "proposal"
  });

  const firstList = await listNotifications();
  firstList.push({ id: "injected", message: "Injected notification" });
  firstList[0].message = "Mutated notification";

  const secondList = await listNotifications();

  assert.equal(secondList.some((notification) => notification.id === "injected"), false);
  assert.equal(secondList.some((notification) => notification.message === "Mutated notification"), false);
  assert.equal(secondList.some((notification) => notification.message === "Snapshot notification"), true);
});
