import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";
import { createJob, listJobs } from "../services/jobService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";

async function assertDefensiveArrayCopy({ create, list, payload }) {
  const initial = await list();
  const created = await create(payload);
  const snapshot = await list();

  assert.equal(snapshot.length, initial.length + 1);
  assert.equal(snapshot[snapshot.length - 1], created);

  snapshot.length = 0;

  const nextSnapshot = await list();
  assert.equal(nextSnapshot.length, initial.length + 1);
  assert.equal(nextSnapshot[nextSnapshot.length - 1], created);
  assert.notEqual(nextSnapshot, snapshot);
}

test("list services return defensive array copies", async () => {
  await assertDefensiveArrayCopy({
    create: createUser,
    list: listUsers,
    payload: { email: "user@example.com", role: "client" }
  });

  await assertDefensiveArrayCopy({
    create: createJob,
    list: listJobs,
    payload: {
      title: "Build marketplace",
      description: "Build a marketplace workflow",
      budgetMin: 100,
      budgetMax: 500,
      categoryId: "cat_dev",
      skills: ["api"]
    }
  });

  await assertDefensiveArrayCopy({
    create: createProposal,
    list: listProposals,
    payload: { jobId: "job_1", freelancerId: "usr_1", amount: 100, duration: 3 }
  });

  await assertDefensiveArrayCopy({
    create: createReview,
    list: listReviews,
    payload: { reviewerId: "usr_1", revieweeId: "usr_2", rating: 5 }
  });

  await assertDefensiveArrayCopy({
    create: sendMessage,
    list: listMessages,
    payload: { senderId: "usr_1", receiverId: "usr_2", body: "Hello" }
  });

  await assertDefensiveArrayCopy({
    create: createNotification,
    list: listNotifications,
    payload: { userId: "usr_1", message: "A new update is ready" }
  });
});
