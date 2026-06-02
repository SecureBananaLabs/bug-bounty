import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createUser, listUsers } from "../services/userService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";

test("list services return defensive copies so mutations do not affect backing arrays", async () => {
  await createJob({ role: "employer" });
  await createProposal({ coverLetter: "hi" });
  await sendMessage({ content: "hi" });
  await createReview({ reviewerId: "r1", revieweeId: "r2", rating: 5 });
  await createUser({ name: "Test" });
  await createNotification({ message: "hi" });

  (await listJobs()).push({ id: "mutated-job" });
  (await listProposals()).push({ id: "mutated-proposal" });
  (await listMessages()).push({ id: "mutated-message" });
  (await listReviews()).push({ id: "mutated-review" });
  (await listUsers()).push({ id: "mutated-user" });
  (await listNotifications()).push({ id: "mutated-notification" });

  assert.equal((await listJobs()).length, 1, "jobs should only contain the seeded record");
  assert.equal((await listProposals()).length, 1, "proposals should only contain the seeded record");
  assert.equal((await listMessages()).length, 1, "messages should only contain the seeded record");
  assert.equal((await listReviews()).length, 1, "reviews should only contain the seeded record");
  assert.equal((await listUsers()).length, 1, "users should only contain the seeded record");
  assert.equal((await listNotifications()).length, 1, "notifications should only contain the seeded record");
});
