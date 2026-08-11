import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";
import { createUser, listUsers } from "../services/userService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { listMessages, sendMessage } from "../services/messageService.js";

async function assertDefensiveListCopy({ create, list, payload }) {
  await create(payload);

  const firstResult = await list();
  const originalLength = firstResult.length;
  firstResult.push({ id: "injected" });

  const secondResult = await list();
  assert.equal(secondResult.length, originalLength);
  assert.equal(secondResult.some((item) => item.id === "injected"), false);
  assert.notEqual(firstResult, secondResult);
}

test("job lists return defensive array copies", async () => {
  await assertDefensiveListCopy({
    create: createJob,
    list: listJobs,
    payload: { title: "Job" }
  });
});

test("user lists return defensive array copies", async () => {
  await assertDefensiveListCopy({
    create: createUser,
    list: listUsers,
    payload: { email: "user@example.com" }
  });
});

test("proposal lists return defensive array copies", async () => {
  await assertDefensiveListCopy({
    create: createProposal,
    list: listProposals,
    payload: { jobId: "job_1" }
  });
});

test("notification lists return defensive array copies", async () => {
  await assertDefensiveListCopy({
    create: createNotification,
    list: listNotifications,
    payload: { userId: "usr_1", text: "Hello" }
  });
});

test("review lists return defensive array copies", async () => {
  await assertDefensiveListCopy({
    create: createReview,
    list: listReviews,
    payload: { jobId: "job_1", rating: 5 }
  });
});

test("message lists return defensive array copies", async () => {
  await assertDefensiveListCopy({
    create: sendMessage,
    list: listMessages,
    payload: { from: "usr_1", to: "usr_2", text: "Hi" }
  });
});
