import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createUser, listUsers } from "../services/userService.js";

async function assertListReturnsCopy({ createItem, listItems, payload }) {
  const before = await listItems();
  await createItem(payload);

  const snapshot = await listItems();
  assert.equal(snapshot.length, before.length + 1);

  snapshot.pop();

  const afterMutation = await listItems();
  assert.equal(afterMutation.length, before.length + 1);
}

test("list services return copies of their internal arrays", async () => {
  await assertListReturnsCopy({
    createItem: createJob,
    listItems: listJobs,
    payload: { title: "Job", description: "Desc", budgetMin: 1, budgetMax: 2, categoryId: "cat", skills: [] }
  });
  await assertListReturnsCopy({
    createItem: sendMessage,
    listItems: listMessages,
    payload: { fromUserId: "usr_a", toUserId: "usr_b", body: "hello" }
  });
  await assertListReturnsCopy({
    createItem: createNotification,
    listItems: listNotifications,
    payload: { userId: "usr_a", type: "info", message: "ping" }
  });
  await assertListReturnsCopy({
    createItem: createProposal,
    listItems: listProposals,
    payload: { jobId: "job_1", freelancerId: "usr_a", coverLetter: "hi", bidAmount: 10 }
  });
  await assertListReturnsCopy({
    createItem: createReview,
    listItems: listReviews,
    payload: { reviewerId: "usr_a", revieweeId: "usr_b", rating: 5, comment: "great" }
  });
  await assertListReturnsCopy({
    createItem: createUser,
    listItems: listUsers,
    payload: { email: "copy@example.com", role: "client" }
  });
});
