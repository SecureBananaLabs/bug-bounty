import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createUser, listUsers } from "../services/userService.js";

async function assertListSnapshot({ create, list, payload }) {
  const before = await list();
  await create(payload);

  const snapshot = await list();
  assert.equal(snapshot.length, before.length + 1);

  snapshot.length = 0;

  const afterMutation = await list();
  assert.equal(afterMutation.length, before.length + 1);
}

test("user lists are defensive array snapshots", async () => {
  await assertListSnapshot({
    create: createUser,
    list: listUsers,
    payload: { email: "snapshot-user@example.com", role: "client" }
  });
});

test("job lists are defensive array snapshots", async () => {
  await assertListSnapshot({
    create: createJob,
    list: listJobs,
    payload: {
      title: "Snapshot job",
      description: "Verify list snapshots cannot mutate backing arrays",
      budgetMin: 10,
      budgetMax: 25,
      categoryId: "cat_test",
      skills: ["testing"]
    }
  });
});

test("proposal lists are defensive array snapshots", async () => {
  await assertListSnapshot({
    create: createProposal,
    list: listProposals,
    payload: { jobId: "job_snapshot", freelancerId: "usr_snapshot", coverLetter: "Ready to help" }
  });
});

test("review lists are defensive array snapshots", async () => {
  await assertListSnapshot({
    create: createReview,
    list: listReviews,
    payload: { jobId: "job_snapshot", freelancerId: "usr_snapshot", rating: 5, comment: "Great work" }
  });
});

test("message lists are defensive array snapshots", async () => {
  await assertListSnapshot({
    create: sendMessage,
    list: listMessages,
    payload: { threadId: "thr_snapshot", body: "Hello" }
  });
});

test("notification lists are defensive array snapshots", async () => {
  await assertListSnapshot({
    create: createNotification,
    list: listNotifications,
    payload: { userId: "usr_snapshot", type: "proposal", message: "New update" }
  });
});
