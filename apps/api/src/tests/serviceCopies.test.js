import assert from "node:assert/strict";
import test from "node:test";
import { createJob, listJobs } from "../services/jobService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import {
  createNotification,
  listNotifications,
} from "../services/notificationService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createUser, listUsers } from "../services/userService.js";

async function assertFreshArrays(label, createFn, listFn, payload) {
  const created = await createFn(payload);
  const first = await listFn();
  const second = await listFn();

  assert.notStrictEqual(first, second, `${label} should return a fresh array`);
  assert.ok(
    second.some((item) => item.id === created.id),
    `${label} should include the created item`
  );
}

test("list services return defensive snapshots", async () => {
  await assertFreshArrays("users", createUser, listUsers, {
    name: "Snapshot User",
  });
  await assertFreshArrays("jobs", createJob, listJobs, {
    title: "Snapshot Job",
  });
  await assertFreshArrays("proposals", createProposal, listProposals, {
    jobId: "job_snapshot",
    userId: "usr_snapshot",
  });
  await assertFreshArrays("messages", sendMessage, listMessages, {
    fromUserId: "usr_snapshot",
    toUserId: "usr_snapshot",
    body: "hello",
  });
  await assertFreshArrays("notifications", createNotification, listNotifications, {
    userId: "usr_snapshot",
    body: "ping",
  });
  await assertFreshArrays("reviews", createReview, listReviews, {
    targetUserId: "usr_snapshot",
    jobId: "job_snapshot",
    rating: 5,
  });
});
