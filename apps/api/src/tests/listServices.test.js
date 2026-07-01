import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createUser, listUsers } from "../services/userService.js";

async function assertListSnapshotCannotMutateStore(createRecord, listRecords, payload, injectedId) {
  const created = await createRecord(payload);
  const snapshot = await listRecords();

  snapshot.push({ id: injectedId });
  snapshot.length = 0;

  const freshSnapshot = await listRecords();

  assert.ok(freshSnapshot.some((record) => record.id === created.id));
  assert.equal(freshSnapshot.some((record) => record.id === injectedId), false);
}

test("list services return snapshots instead of mutable backing stores", async () => {
  await assertListSnapshotCannotMutateStore(
    createJob,
    listJobs,
    {
      title: "Build audit dashboard",
      description: "Create reporting views for marketplace operators.",
      budgetMin: 100,
      budgetMax: 200,
      categoryId: "analytics",
      skills: ["node"]
    },
    "job_injected"
  );

  await assertListSnapshotCannotMutateStore(
    createUser,
    listUsers,
    { email: "snapshot-user@example.com", name: "Snapshot User", role: "client" },
    "usr_injected"
  );

  await assertListSnapshotCannotMutateStore(
    sendMessage,
    listMessages,
    { senderId: "usr_sender", receiverId: "usr_receiver", body: "Hello" },
    "msg_injected"
  );

  await assertListSnapshotCannotMutateStore(
    createNotification,
    listNotifications,
    { userId: "usr_notify", type: "proposal", message: "Proposal received" },
    "ntf_injected"
  );

  await assertListSnapshotCannotMutateStore(
    createProposal,
    listProposals,
    { jobId: "job_snapshot", freelancerId: "usr_freelancer", coverLetter: "I can help.", bidAmount: 150 },
    "prp_injected"
  );

  await assertListSnapshotCannotMutateStore(
    createReview,
    listReviews,
    { reviewerId: "usr_reviewer", revieweeId: "usr_reviewee", rating: 5, comment: "Great work" },
    "rev_injected"
  );
});
