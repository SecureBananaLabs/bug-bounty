import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import {
  createNotification,
  listNotifications
} from "../services/notificationService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createUser, listUsers } from "../services/userService.js";

test("listJobs returns an array snapshot with copied record fields", async () => {
  const created = await createJob({
    title: "Snapshot safety",
    tags: ["api", "safety"]
  });
  const listed = await listJobs();
  const listedJob = listed.find((job) => job.id === created.id);

  listed.push({ id: "injected-job", title: "Injected" });
  listedJob.title = "Mutated title";
  listedJob.tags.push("mutated");

  const later = await listJobs();
  const storedJob = later.find((job) => job.id === created.id);

  assert.equal(later.some((job) => job.id === "injected-job"), false);
  assert.equal(storedJob.title, "Snapshot safety");
  assert.deepEqual(storedJob.tags, ["api", "safety"]);
});

test("listUsers returns copied records and array-valued fields", async () => {
  const created = await createUser({
    email: "snapshot@example.com",
    roles: ["client"]
  });
  const listed = await listUsers();
  const listedUser = listed.find((user) => user.id === created.id);

  listedUser.email = "mutated@example.com";
  listedUser.roles.push("admin");

  const later = await listUsers();
  const storedUser = later.find((user) => user.id === created.id);

  assert.equal(storedUser.email, "snapshot@example.com");
  assert.deepEqual(storedUser.roles, ["client"]);
});

test("listProposals returns copied records and array-valued fields", async () => {
  const created = await createProposal({
    jobId: "job_snapshot",
    freelancerId: "usr_snapshot",
    milestones: ["draft", "final"]
  });
  const listed = await listProposals();
  const listedProposal = listed.find((proposal) => proposal.id === created.id);

  listed.push({ id: "injected-proposal", jobId: "job_injected" });
  listedProposal.jobId = "job_mutated";
  listedProposal.milestones.push("mutated");

  const later = await listProposals();
  const storedProposal = later.find((proposal) => proposal.id === created.id);

  assert.equal(
    later.some((proposal) => proposal.id === "injected-proposal"),
    false
  );
  assert.equal(storedProposal.jobId, "job_snapshot");
  assert.deepEqual(storedProposal.milestones, ["draft", "final"]);
});

test("listReviews returns copied records and array-valued fields", async () => {
  const created = await createReview({
    proposalId: "prp_snapshot",
    reviewerId: "usr_reviewer",
    notes: ["scope", "tests"]
  });
  const listed = await listReviews();
  const listedReview = listed.find((review) => review.id === created.id);

  listed.push({ id: "injected-review", proposalId: "prp_injected" });
  listedReview.reviewerId = "usr_mutated";
  listedReview.notes.push("mutated");

  const later = await listReviews();
  const storedReview = later.find((review) => review.id === created.id);

  assert.equal(later.some((review) => review.id === "injected-review"), false);
  assert.equal(storedReview.reviewerId, "usr_reviewer");
  assert.deepEqual(storedReview.notes, ["scope", "tests"]);
});

test("listMessages returns copied records and array-valued fields", async () => {
  const created = await sendMessage({
    threadId: "thread_snapshot",
    senderId: "usr_sender",
    recipients: ["usr_recipient"]
  });
  const listed = await listMessages();
  const listedMessage = listed.find((message) => message.id === created.id);

  listed.push({ id: "injected-message", threadId: "thread_injected" });
  listedMessage.threadId = "thread_mutated";
  listedMessage.recipients.push("usr_mutated");

  const later = await listMessages();
  const storedMessage = later.find((message) => message.id === created.id);

  assert.equal(
    later.some((message) => message.id === "injected-message"),
    false
  );
  assert.equal(storedMessage.threadId, "thread_snapshot");
  assert.deepEqual(storedMessage.recipients, ["usr_recipient"]);
});

test("listNotifications returns copied records and array-valued fields", async () => {
  const created = await createNotification({
    userId: "usr_snapshot",
    message: "Snapshot safety",
    channels: ["web", "email"]
  });
  const listed = await listNotifications();
  const listedNotification = listed.find(
    (notification) => notification.id === created.id
  );

  listed.push({ id: "injected-notification", userId: "usr_injected" });
  listedNotification.userId = "usr_mutated";
  listedNotification.channels.push("sms");

  const later = await listNotifications();
  const storedNotification = later.find(
    (notification) => notification.id === created.id
  );

  assert.equal(
    later.some((notification) => notification.id === "injected-notification"),
    false
  );
  assert.equal(storedNotification.userId, "usr_snapshot");
  assert.deepEqual(storedNotification.channels, ["web", "email"]);
});
