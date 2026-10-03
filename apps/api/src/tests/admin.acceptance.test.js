import test from "node:test";
import assert from "node:assert/strict";
import { jobs, disputes, resetStore } from "../services/adminStore.js";
import { listNotifications } from "../services/notificationService.js";
import { listUsers, moderateListing, resolveDispute } from "../services/adminService.js";

test("user management filters by join date server-side", async () => {
  resetStore();
  const result = await listUsers({ joinedBefore: "2024-02-20", page: 1, pageSize: 20 });
  assert.ok(result.items.length > 0);
  assert.ok(result.items.every((user) => new Date(user.joinedAt) <= new Date("2024-02-20")));
  assert.ok(result.items.some((user) => user.id === "usr_1"));
  assert.ok(result.items.some((user) => user.id === "usr_2"));
  assert.ok(!result.items.some((user) => user.id === "usr_3"));
});

test("rejecting a listing creates a real notification for the posting user with the reason", async () => {
  resetStore();
  const before = (await listNotifications()).length;
  const job = jobs.find((item) => item.id === "job_2");

  await moderateListing("usr_4", job.id, "reject", "Duplicate listing");

  const notifications = await listNotifications();
  const created = notifications.slice(before);
  assert.equal(created.length, 1);
  assert.equal(created[0].userId, job.clientId);
  assert.equal(created[0].type, "listing_rejected");
  assert.match(created[0].message, /Duplicate listing/);
});

test("resolving a dispute notifies both parties", async () => {
  resetStore();
  const before = (await listNotifications()).length;
  const dispute = disputes.find((item) => item.id === "dis_1");

  await resolveDispute("usr_4", dispute.id, "client", {
    refund: true,
    reason: "Evidence supports the client",
  });

  const notifications = (await listNotifications()).slice(before);
  assert.equal(notifications.length, 2);
  assert.deepEqual(
    new Set(notifications.map((notification) => notification.userId)),
    new Set([dispute.freelancerId, dispute.clientId])
  );
  assert.ok(notifications.every((notification) => notification.type === "dispute_resolved"));
  assert.ok(notifications.every((notification) => /resolved in favour of the client/.test(notification.message)));
});
