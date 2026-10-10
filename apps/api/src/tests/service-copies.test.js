import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createUser, listUsers } from "../services/userService.js";

async function assertDefensiveCopies({ create, list, payload, mutate }) {
  const created = await create(payload);
  const expected = {
    ...created,
    ...Object.fromEntries(
      Object.entries(created)
        .filter(([, value]) => Array.isArray(value))
        .map(([key, value]) => [key, [...value]])
    )
  };
  mutate(created);

  const firstList = await list();
  const firstListed = firstList.find((record) => record.id === created.id);
  assert.ok(firstListed);

  firstList.push({ id: "injected" });
  mutate(firstListed);

  const secondList = await list();
  const stored = secondList.find((record) => record.id === created.id);
  assert.ok(stored);
  assert.equal(secondList.some((record) => record.id === "injected"), false);
  assert.deepEqual(stored, expected);
}

test("user service returns defensive copies", async () => {
  await assertDefensiveCopies({
    create: createUser,
    list: listUsers,
    payload: { email: "copy-user@example.com", role: "client", skills: ["planning"] },
    mutate(record) {
      record.email = "mutated@example.com";
      record.skills.push("mutated");
    }
  });
});

test("job service returns defensive copies", async () => {
  await assertDefensiveCopies({
    create: createJob,
    list: listJobs,
    payload: { title: "Copy-safe job", budget: 100, skills: ["react"] },
    mutate(record) {
      record.title = "Mutated job";
      record.skills.push("mutated");
    }
  });
});

test("message service returns defensive copies", async () => {
  await assertDefensiveCopies({
    create: sendMessage,
    list: listMessages,
    payload: { from: "usr_a", to: "usr_b", body: "hello" },
    mutate(record) {
      record.body = "mutated";
    }
  });
});

test("notification service returns defensive copies", async () => {
  await assertDefensiveCopies({
    create: createNotification,
    list: listNotifications,
    payload: { userId: "usr_a", message: "hello" },
    mutate(record) {
      record.message = "mutated";
      record.read = true;
    }
  });
});

test("proposal service returns defensive copies", async () => {
  await assertDefensiveCopies({
    create: createProposal,
    list: listProposals,
    payload: { jobId: "job_a", freelancerId: "usr_a", skills: ["node"] },
    mutate(record) {
      record.freelancerId = "usr_mutated";
      record.skills.push("mutated");
    }
  });
});

test("review service returns defensive copies", async () => {
  await assertDefensiveCopies({
    create: createReview,
    list: listReviews,
    payload: { jobId: "job_a", reviewerId: "usr_a", rating: 5 },
    mutate(record) {
      record.rating = 1;
    }
  });
});
