import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";
import { createJob, listJobs } from "../services/jobService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";

async function assertDefensiveCreateSnapshot({ create, list, payload, mutate }) {
  const created = await create(payload);
  const originalId = created.id;
  const originalCreated = snapshotRecord(created);

  mutate(created);

  const stored = (await list()).find((record) => record.id === originalId);
  assert.ok(stored);
  assert.notEqual(stored, created);
  assert.equal(stored.id, originalId);
  assert.deepEqual(stored, originalCreated);
}

function snapshotRecord(record) {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      Array.isArray(value) ? [...value] : value
    ])
  );
}

test("create services return snapshots that do not mutate stored records", async () => {
  await assertDefensiveCreateSnapshot({
    create: createUser,
    list: listUsers,
    payload: { email: "user@example.com", role: "client" },
    mutate: (user) => {
      user.email = "changed@example.com";
    }
  });

  await assertDefensiveCreateSnapshot({
    create: createJob,
    list: listJobs,
    payload: {
      title: "Build marketplace",
      description: "Build a marketplace workflow",
      budgetMin: 100,
      budgetMax: 500,
      categoryId: "cat_dev",
      skills: ["api"]
    },
    mutate: (job) => {
      job.title = "Changed title";
      job.skills.push("mutated");
    }
  });

  await assertDefensiveCreateSnapshot({
    create: createProposal,
    list: listProposals,
    payload: { jobId: "job_1", freelancerId: "usr_1", amount: 100, duration: 3 },
    mutate: (proposal) => {
      proposal.amount = 1;
    }
  });

  await assertDefensiveCreateSnapshot({
    create: createReview,
    list: listReviews,
    payload: { reviewerId: "usr_1", revieweeId: "usr_2", rating: 5 },
    mutate: (review) => {
      review.rating = 1;
    }
  });

  await assertDefensiveCreateSnapshot({
    create: sendMessage,
    list: listMessages,
    payload: { senderId: "usr_1", receiverId: "usr_2", body: "Hello" },
    mutate: (message) => {
      message.body = "Changed";
    }
  });

  await assertDefensiveCreateSnapshot({
    create: createNotification,
    list: listNotifications,
    payload: { userId: "usr_1", message: "A new update is ready" },
    mutate: (notification) => {
      notification.message = "Changed";
    }
  });
});

test("create services copy payload arrays before storing records", async () => {
  const payload = {
    title: "Build analytics",
    description: "Build analytics workflow",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "cat_data",
    skills: ["analytics"]
  };

  const created = await createJob(payload);

  payload.skills.push("mutated");

  const stored = (await listJobs()).find((job) => job.id === created.id);
  assert.deepEqual(stored.skills, ["analytics"]);
  assert.notEqual(stored.skills, payload.skills);
});
