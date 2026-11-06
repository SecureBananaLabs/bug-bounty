import test from "node:test";
import assert from "node:assert/strict";
import { createNotification, listNotifications } from "../services/notificationService.js";

test("notification service returns defensive copies of stored notifications", async () => {
  const created = await createNotification({
    userId: "user_1",
    message: "Proposal accepted.",
  });

  created.message = "mutated returned notification";

  const firstList = await listNotifications();
  const storedNotification = firstList.find((notification) => notification.id === created.id);

  assert.equal(storedNotification.message, "Proposal accepted.");

  firstList.push({ id: "ntf_fake", message: "injected" });
  storedNotification.message = "mutated list notification";

  const secondList = await listNotifications();
  const preservedNotification = secondList.find((notification) => notification.id === created.id);

  assert.equal(secondList.some((notification) => notification.id === "ntf_fake"), false);
  assert.equal(preservedNotification.message, "Proposal accepted.");
});
