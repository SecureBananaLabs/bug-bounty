import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createUser, listUsers } from "../services/userService.js";

async function assertListIsDefensiveCopy(createRecord, listRecords, sampleRecord) {
  const before = await listRecords();
  const created = await createRecord(sampleRecord);
  const firstList = await listRecords();

  firstList.push({ id: "mutated_by_consumer" });
  firstList.length = 0;

  const secondList = await listRecords();

  assert.equal(secondList.length, before.length + 1);
  assert.deepEqual(secondList.at(-1), created);
  assert.notEqual(firstList, secondList);
}

test("list services return defensive array copies", async () => {
  await assertListIsDefensiveCopy(createUser, listUsers, {
    email: "copy-user@example.com",
    role: "client"
  });

  await assertListIsDefensiveCopy(createJob, listJobs, {
    title: "Copy-safe listing",
    description: "Ensure list responses cannot mutate storage",
    budgetMin: 10,
    budgetMax: 20,
    categoryId: "cat_testing",
    skills: ["node"]
  });

  await assertListIsDefensiveCopy(createProposal, listProposals, {
    jobId: "job_copy",
    freelancerId: "usr_copy",
    coverLetter: "I can validate defensive copies."
  });

  await assertListIsDefensiveCopy(createReview, listReviews, {
    targetId: "usr_reviewed",
    rating: 5,
    comment: "List response stayed isolated."
  });

  await assertListIsDefensiveCopy(sendMessage, listMessages, {
    senderId: "usr_sender",
    recipientId: "usr_recipient",
    content: "The list response is a snapshot."
  });

  await assertListIsDefensiveCopy(createNotification, listNotifications, {
    userId: "usr_notified",
    type: "message.received",
    message: "A message arrived."
  });
});
