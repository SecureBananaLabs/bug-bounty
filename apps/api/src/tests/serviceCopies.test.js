import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createUser, listUsers } from "../services/userService.js";

async function assertListDefendsStoredState({
  create,
  list,
  sample,
  markerKey,
  mutateListedRecord,
  assertStoredRecord
}) {
  await create(sample);

  const listed = await list();
  const listedRecord = listed.find((record) => record[markerKey] === sample[markerKey]);

  assert.ok(listedRecord, `expected ${markerKey} record to be listed`);

  listed.push({ [markerKey]: `injected-${sample[markerKey]}` });
  mutateListedRecord(listedRecord);

  const listedAgain = await list();
  const storedRecord = listedAgain.find((record) => record[markerKey] === sample[markerKey]);

  assert.ok(storedRecord, `expected stored ${markerKey} record to remain available`);
  assert.equal(
    listedAgain.some((record) => record[markerKey] === `injected-${sample[markerKey]}`),
    false
  );
  assertStoredRecord(storedRecord);
}

test("listJobs returns defensive copies", async () => {
  const sample = {
    title: "Defensive copy job",
    description: "Verify listed jobs cannot mutate stored state",
    budgetMin: 100,
    budgetMax: 200,
    categoryId: "engineering",
    skills: ["node", "api"]
  };

  await assertListDefendsStoredState({
    create: createJob,
    list: listJobs,
    sample,
    markerKey: "title",
    mutateListedRecord(record) {
      record.title = "mutated job title";
      record.skills.push("mutated-skill");
    },
    assertStoredRecord(record) {
      assert.equal(record.title, sample.title);
      assert.deepEqual(record.skills, sample.skills);
    }
  });
});

test("listMessages returns defensive copies", async () => {
  const sample = {
    senderId: "usr_sender",
    receiverId: "usr_receiver",
    body: "Defensive copy message"
  };

  await assertListDefendsStoredState({
    create: sendMessage,
    list: listMessages,
    sample,
    markerKey: "body",
    mutateListedRecord(record) {
      record.body = "mutated message";
      record.sentAt = "mutated timestamp";
    },
    assertStoredRecord(record) {
      assert.equal(record.body, sample.body);
      assert.notEqual(record.sentAt, "mutated timestamp");
    }
  });
});

test("listNotifications returns defensive copies", async () => {
  const sample = {
    userId: "usr_target",
    type: "proposal",
    message: "Defensive copy notification"
  };

  await assertListDefendsStoredState({
    create: createNotification,
    list: listNotifications,
    sample,
    markerKey: "message",
    mutateListedRecord(record) {
      record.message = "mutated notification";
      record.read = true;
    },
    assertStoredRecord(record) {
      assert.equal(record.message, sample.message);
      assert.equal(record.read, false);
    }
  });
});

test("listProposals returns defensive copies", async () => {
  const sample = {
    jobId: "job_target",
    freelancerId: "usr_freelancer",
    coverLetter: "Defensive copy proposal",
    bidAmount: 1500,
    estimatedDuration: "2 weeks"
  };

  await assertListDefendsStoredState({
    create: createProposal,
    list: listProposals,
    sample,
    markerKey: "coverLetter",
    mutateListedRecord(record) {
      record.coverLetter = "mutated proposal";
      record.bidAmount = 1;
    },
    assertStoredRecord(record) {
      assert.equal(record.coverLetter, sample.coverLetter);
      assert.equal(record.bidAmount, sample.bidAmount);
    }
  });
});

test("listReviews returns defensive copies", async () => {
  const sample = {
    targetUserId: "usr_target",
    reviewerId: "usr_reviewer",
    rating: 5,
    comment: "Defensive copy review"
  };

  await assertListDefendsStoredState({
    create: createReview,
    list: listReviews,
    sample,
    markerKey: "comment",
    mutateListedRecord(record) {
      record.comment = "mutated review";
      record.rating = 1;
    },
    assertStoredRecord(record) {
      assert.equal(record.comment, sample.comment);
      assert.equal(record.rating, sample.rating);
    }
  });
});

test("listUsers returns defensive copies", async () => {
  const sample = {
    email: "defensive-copy@example.com",
    name: "Defensive Copy",
    role: "client"
  };

  await assertListDefendsStoredState({
    create: createUser,
    list: listUsers,
    sample,
    markerKey: "email",
    mutateListedRecord(record) {
      record.email = "mutated@example.com";
      record.role = "admin";
    },
    assertStoredRecord(record) {
      assert.equal(record.email, sample.email);
      assert.equal(record.role, sample.role);
    }
  });
});
