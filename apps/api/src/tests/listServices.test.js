import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createUser, listUsers } from "../services/userService.js";

async function assertListIsSnapshot({ create, list, payload, idPrefix }) {
  const initialLength = (await list()).length;
  const created = await create(payload);

  assert.match(created.id, new RegExp(`^${idPrefix}_`));

  const snapshot = await list();
  assert.equal(snapshot.length, initialLength + 1);

  snapshot.length = 0;

  const afterMutation = await list();
  assert.equal(afterMutation.length, initialLength + 1);
  assert.equal(afterMutation.at(-1).id, created.id);
}

test("list services return defensive array snapshots", async () => {
  await assertListIsSnapshot({
    create: createUser,
    list: listUsers,
    payload: { email: "snapshot-user@example.com", role: "client" },
    idPrefix: "usr"
  });

  await assertListIsSnapshot({
    create: createJob,
    list: listJobs,
    payload: { title: "Snapshot job", description: "Verify list snapshots" },
    idPrefix: "job"
  });

  await assertListIsSnapshot({
    create: createProposal,
    list: listProposals,
    payload: { jobId: "job_snapshot", userId: "usr_snapshot" },
    idPrefix: "prp"
  });

  await assertListIsSnapshot({
    create: createReview,
    list: listReviews,
    payload: { reviewerId: "usr_a", revieweeId: "usr_b", rating: 5 },
    idPrefix: "rev"
  });

  await assertListIsSnapshot({
    create: sendMessage,
    list: listMessages,
    payload: { senderId: "usr_a", recipientId: "usr_b", content: "hello" },
    idPrefix: "msg"
  });

  await assertListIsSnapshot({
    create: createNotification,
    list: listNotifications,
    payload: { userId: "usr_a", type: "proposal", message: "new proposal" },
    idPrefix: "ntf"
  });
});
