import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createUser, listUsers } from "../services/userService.js";

async function assertServiceReturnsDefensiveCopies(createRecord, listRecords, payload) {
  const created = await createRecord(payload);
  const id = created.id;

  created.mutatedAfterCreate = true;

  const firstList = await listRecords();
  const listed = firstList.find((record) => record.id === id);
  assert.ok(listed);

  listed.mutatedAfterList = true;
  if (Array.isArray(listed.skills)) {
    listed.skills.push("mutated-skill");
  }
  firstList.push({ id: "injected-record" });

  const secondList = await listRecords();
  const stored = secondList.find((record) => record.id === id);

  assert.ok(stored);
  assert.equal(stored.mutatedAfterCreate, undefined);
  assert.equal(stored.mutatedAfterList, undefined);
  assert.equal(secondList.some((record) => record.id === "injected-record"), false);

  return stored;
}

test("list service results cannot mutate stored user records", async () => {
  const stored = await assertServiceReturnsDefensiveCopies(createUser, listUsers, {
    email: "defensive-user@example.com",
    skills: ["Next.js", "TypeScript"]
  });

  assert.deepEqual(stored.skills, ["Next.js", "TypeScript"]);
});

test("list service results cannot mutate stored job records", async () => {
  const stored = await assertServiceReturnsDefensiveCopies(createJob, listJobs, {
    title: "Build a focused test fixture",
    description: "Create a regression fixture for copied service records.",
    budgetMin: 100,
    budgetMax: 250,
    categoryId: "testing",
    skills: ["node:test"]
  });

  assert.deepEqual(stored.skills, ["node:test"]);
});

test("list service results cannot mutate stored message records", async () => {
  const stored = await assertServiceReturnsDefensiveCopies(sendMessage, listMessages, {
    body: "Hello",
    senderId: "usr_sender",
    receiverId: "usr_receiver"
  });

  assert.equal(stored.body, "Hello");
});

test("list service results cannot mutate stored notification records", async () => {
  const stored = await assertServiceReturnsDefensiveCopies(createNotification, listNotifications, {
    userId: "usr_notified",
    title: "Proposal update",
    body: "A proposal changed status."
  });

  assert.equal(stored.read, false);
});

test("list service results cannot mutate stored proposal records", async () => {
  const stored = await assertServiceReturnsDefensiveCopies(createProposal, listProposals, {
    coverLetter: "I can complete this safely.",
    bidAmount: 175,
    estDuration: "2 days",
    jobId: "job_target",
    freelancerId: "usr_freelancer"
  });

  assert.equal(stored.bidAmount, 175);
});

test("list service results cannot mutate stored review records", async () => {
  const stored = await assertServiceReturnsDefensiveCopies(createReview, listReviews, {
    rating: 5,
    comment: "Great collaboration.",
    reviewerId: "usr_reviewer",
    revieweeId: "usr_reviewee"
  });

  assert.equal(stored.rating, 5);
});
