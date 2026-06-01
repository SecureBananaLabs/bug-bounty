import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";
import { createJob, listJobs } from "../services/jobService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";

async function assertSnapshotList({ create, list, payload }) {
  const record = await create(payload);
  const first = await list();

  assert.equal(first.length, 1);
  assert.strictEqual(first[0], record);

  first.push({ id: "corrupt" });

  const second = await list();
  assert.notStrictEqual(second, first);
  assert.deepEqual(second, [record]);
}

test("user list responses are defensive snapshots", async () => {
  await assertSnapshotList({
    create: createUser,
    list: listUsers,
    payload: { name: "Ada Lovelace" },
  });
});

test("job list responses are defensive snapshots", async () => {
  await assertSnapshotList({
    create: createJob,
    list: listJobs,
    payload: { title: "Review contract" },
  });
});

test("proposal list responses are defensive snapshots", async () => {
  await assertSnapshotList({
    create: createProposal,
    list: listProposals,
    payload: { title: "Initial proposal" },
  });
});

test("review list responses are defensive snapshots", async () => {
  await assertSnapshotList({
    create: createReview,
    list: listReviews,
    payload: { rating: 5, comment: "Great work" },
  });
});

test("message list responses are defensive snapshots", async () => {
  await assertSnapshotList({
    create: sendMessage,
    list: listMessages,
    payload: { to: "client", body: "Hello" },
  });
});

test("notification list responses are defensive snapshots", async () => {
  await assertSnapshotList({
    create: createNotification,
    list: listNotifications,
    payload: { type: "alert", message: "New activity" },
  });
});
