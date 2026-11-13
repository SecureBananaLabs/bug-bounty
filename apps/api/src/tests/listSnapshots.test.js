import test from "node:test";
import assert from "node:assert/strict";

import { createJob, listJobs } from "../services/jobService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createUser, listUsers } from "../services/userService.js";

const listCases = [
  {
    name: "users",
    create: () => createUser({ email: `user-${Date.now()}@example.com` }),
    list: listUsers
  },
  {
    name: "jobs",
    create: () => createJob({ title: `Job ${Date.now()}` }),
    list: listJobs
  },
  {
    name: "proposals",
    create: () => createProposal({ jobId: "job_snapshot", userId: "usr_snapshot" }),
    list: listProposals
  },
  {
    name: "reviews",
    create: () => createReview({ userId: "usr_snapshot", rating: 5 }),
    list: listReviews
  },
  {
    name: "messages",
    create: () => sendMessage({ from: "usr_a", to: "usr_b", body: "snapshot check" }),
    list: listMessages
  },
  {
    name: "notifications",
    create: () => createNotification({ userId: "usr_snapshot", message: "snapshot check" }),
    list: listNotifications
  }
];

for (const { name, create, list } of listCases) {
  test(`${name} list returns a defensive snapshot`, async () => {
    const created = await create();
    const snapshot = await list();

    snapshot.push({ id: `mutated_${name}` });
    snapshot.pop();
    snapshot[0] = { id: `reassigned_${name}` };

    const nextSnapshot = await list();

    assert.ok(nextSnapshot.some((item) => item.id === created.id));
    assert.equal(nextSnapshot.some((item) => item.id === `mutated_${name}`), false);
    assert.equal(nextSnapshot.some((item) => item.id === `reassigned_${name}`), false);
    assert.notEqual(nextSnapshot, snapshot);
  });
}
