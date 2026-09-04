import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";
import { sendMessage } from "../services/messageService.js";
import { createNotification } from "../services/notificationService.js";
import { createProposal } from "../services/proposalService.js";
import { createReview } from "../services/reviewService.js";
import { createUser } from "../services/userService.js";

async function withFixedTime(callback) {
  const originalNow = Date.now;
  Date.now = () => 1780879000000;

  try {
    await callback();
  } finally {
    Date.now = originalNow;
  }
}

test("record services create unique ids within the same millisecond", async () => {
  await withFixedTime(async () => {
    const records = [
      await createJob({
        title: "Build API",
        description: "Build the API service",
        budgetMin: 10,
        budgetMax: 20,
        categoryId: "cat"
      }),
      await createJob({
        title: "Test API",
        description: "Test the API service",
        budgetMin: 20,
        budgetMax: 30,
        categoryId: "cat"
      }),
      await createUser({ email: "a@example.com" }),
      await createUser({ email: "b@example.com" }),
      await createProposal({ jobId: "job_1", freelancerId: "usr_1", bidAmount: 20 }),
      await createProposal({ jobId: "job_2", freelancerId: "usr_2", bidAmount: 30 }),
      await sendMessage({ senderId: "usr_1", receiverId: "usr_2", body: "hello" }),
      await sendMessage({ senderId: "usr_2", receiverId: "usr_1", body: "hi" }),
      await createReview({ reviewerId: "usr_1", revieweeId: "usr_2", rating: 5 }),
      await createReview({ reviewerId: "usr_2", revieweeId: "usr_1", rating: 4 }),
      await createNotification({ userId: "usr_1", title: "One", body: "First" }),
      await createNotification({ userId: "usr_1", title: "Two", body: "Second" })
    ];

    const ids = records.map((record) => record.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.deepEqual(ids, [
      "job_1780879000000",
      "job_1780879000000_1",
      "usr_1780879000000_2",
      "usr_1780879000000_3",
      "prp_1780879000000_4",
      "prp_1780879000000_5",
      "msg_1780879000000_6",
      "msg_1780879000000_7",
      "rev_1780879000000_8",
      "rev_1780879000000_9",
      "ntf_1780879000000_10",
      "ntf_1780879000000_11"
    ]);
  });
});
