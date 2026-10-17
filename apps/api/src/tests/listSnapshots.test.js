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
    create: () => createUser({ email: "snapshot-user@example.com" }),
    list: listUsers
  },
  {
    name: "jobs",
    create: () => createJob({ title: "Snapshot job", budget: 100 }),
    list: listJobs
  },
  {
    name: "proposals",
    create: () => createProposal({ jobId: "job_snapshot", coverLetter: "Snapshot proposal" }),
    list: listProposals
  },
  {
    name: "reviews",
    create: () => createReview({ targetId: "usr_snapshot", rating: 5, comment: "Snapshot review" }),
    list: listReviews
  },
  {
    name: "messages",
    create: () => sendMessage({ threadId: "thr_snapshot", body: "Snapshot message" }),
    list: listMessages
  },
  {
    name: "notifications",
    create: () => createNotification({ userId: "usr_snapshot", title: "Snapshot notification" }),
    list: listNotifications
  }
];

for (const listCase of listCases) {
  test(`${listCase.name} list returns a defensive snapshot`, async () => {
    const created = await listCase.create();
    const snapshot = await listCase.list();
    const startingLength = snapshot.length;

    snapshot.pop();
    snapshot.push({ id: "mutated" });
    snapshot.length = 0;

    const nextSnapshot = await listCase.list();

    assert.equal(nextSnapshot.length, startingLength);
    assert.equal(nextSnapshot.at(-1), created);
  });
}
