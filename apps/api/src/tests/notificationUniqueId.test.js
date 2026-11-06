import test from "node:test";
import assert from "node:assert/strict";
import { createNotification, listNotifications } from "../services/notificationService.js";

test("notifications created in the same tick get distinct ids", async () => {
  const before = (await listNotifications()).length;

  const created = await Promise.all([
    createNotification({ title: "first" }),
    createNotification({ title: "second" }),
    createNotification({ title: "third" })
  ]);

  assert.equal(created.length, 3);
  assert.equal(new Set(created.map((item) => item.id)).size, 3);
  assert.ok(created.every((item) => item.id.startsWith("ntf_")));
  assert.ok(created.every((item) => item.read === false));

  const listed = await listNotifications();
  assert.equal(listed.length, before + 3);
  assert.equal(listed.at(-1).title, "third");
});
