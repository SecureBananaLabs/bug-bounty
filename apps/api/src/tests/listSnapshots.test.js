import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createUser, listUsers } from "../services/userService.js";

async function assertListSnapshot({ create, list, payload }) {
  const record = await create(payload);
  const snapshot = await list();
  const initialLength = snapshot.length;

  snapshot.length = 0;
  snapshot.push({ id: "mutated" });

  const nextSnapshot = await list();

  assert.equal(nextSnapshot.length, initialLength);
  assert.equal(nextSnapshot.some((item) => item.id === record.id), true);
  assert.equal(nextSnapshot.some((item) => item.id === "mutated"), false);
}

test("list services return defensive snapshot arrays", async () => {
  await assertListSnapshot({
    create: createUser,
    list: listUsers,
    payload: { name: "Snapshot User" }
  });
  await assertListSnapshot({
    create: createJob,
    list: listJobs,
    payload: { title: "Snapshot Job" }
  });
  await assertListSnapshot({
    create: createProposal,
    list: listProposals,
    payload: { jobId: "job_1", freelancerId: "usr_1" }
  });
  await assertListSnapshot({
    create: createReview,
    list: listReviews,
    payload: { rating: 5, comment: "great" }
  });
  await assertListSnapshot({
    create: sendMessage,
    list: listMessages,
    payload: { senderId: "usr_1", content: "hello" }
  });
  await assertListSnapshot({
    create: createNotification,
    list: listNotifications,
    payload: { userId: "usr_1", message: "hello" }
  });
});
