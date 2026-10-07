import test from "node:test";
import assert from "node:assert/strict";
import { createNotification, listNotifications } from "../services/notificationService.js";

test("notifications created in the same millisecond get distinct ids", async () => {
  const now = Date.now();
  Date.now = () => now;

  const first = await createNotification({ title: "first" });
  const second = await createNotification({ title: "second" });

  assert.match(first.id, /^ntf_/);
  assert.notEqual(first.id, second.id);
});

test("concurrent batches stay distinct when the clock moves backwards", async () => {
  let now = Date.now();
  Date.now = () => now;

  const batch = await Promise.all([
    createNotification({ title: "a" }),
    createNotification({ title: "b" }),
    createNotification({ title: "c" })
  ]);
  now -= 5000;

  const later = await Promise.all([
    createNotification({ title: "d" }),
    createNotification({ title: "e" })
  ]);

  const ids = [...batch, ...later].map((notification) => notification.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("unread default, payload fields and insertion order are unchanged", async () => {
  const before = (await listNotifications()).length;
  const created = await createNotification({ title: "ordered", body: "hello" });
  assert.equal(created.read, false);
  assert.equal(created.title, "ordered");
  assert.equal(created.body, "hello");

  const listed = await listNotifications();

  assert.equal(listed.length, before + 1);
  assert.equal(listed.at(-1).id, created.id);
});
