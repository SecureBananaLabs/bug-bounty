import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import {
  createNotification,
  listNotifications,
} from "../services/notificationService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createUser, listUsers } from "../services/userService.js";

test("create services isolate stored records from returned object mutations", async () => {
  const jobPayload = { title: "Indexer", skills: ["node"] };
  const createdJob = await createJob(jobPayload);
  createdJob.title = "mutated";
  createdJob.skills.push("mutated-return");
  jobPayload.skills.push("mutated-payload");

  const storedJob = (await listJobs()).at(-1);
  assert.equal(storedJob.title, "Indexer");
  assert.deepEqual(storedJob.skills, ["node"]);

  const createdProposal = await createProposal({ title: "Proposal draft" });
  createdProposal.title = "mutated";
  assert.equal((await listProposals()).at(-1).title, "Proposal draft");

  const createdReview = await createReview({ decision: "approve" });
  createdReview.decision = "mutated";
  assert.equal((await listReviews()).at(-1).decision, "approve");

  const createdMessage = await sendMessage({ body: "hello" });
  createdMessage.body = "mutated";
  assert.equal((await listMessages()).at(-1).body, "hello");

  const createdNotification = await createNotification({ text: "new event" });
  createdNotification.text = "mutated";
  assert.equal((await listNotifications()).at(-1).text, "new event");

  const createdUser = await createUser({ email: "user@example.com" });
  createdUser.email = "mutated";
  assert.equal((await listUsers()).at(-1).email, "user@example.com");
});
