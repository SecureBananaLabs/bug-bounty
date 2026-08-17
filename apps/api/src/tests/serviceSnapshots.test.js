import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createUser, listUsers } from "../services/userService.js";

const cases = [
  {
    name: "users",
    create: () => createUser({ email: "snapshot-user@example.com", role: "client" }),
    list: listUsers
  },
  {
    name: "jobs",
    create: () =>
      createJob({
        clientId: "usr_snapshot",
        title: "Snapshot job",
        description: "Prove list snapshots are defensive.",
        budgetMin: 100,
        budgetMax: 200,
        skills: []
      }),
    list: listJobs
  },
  {
    name: "proposals",
    create: () => createProposal({ jobId: "job_snapshot", freelancerId: "usr_snapshot", amount: 150 }),
    list: listProposals
  },
  {
    name: "messages",
    create: () => sendMessage({ senderId: "usr_a", recipientId: "usr_b", body: "snapshot" }),
    list: listMessages
  },
  {
    name: "notifications",
    create: () => createNotification({ userId: "usr_snapshot", message: "snapshot" }),
    list: listNotifications
  },
  {
    name: "reviews",
    create: () => createReview({ jobId: "job_snapshot", reviewerId: "usr_a", rating: 5, comment: "snapshot" }),
    list: listReviews
  }
];

for (const service of cases) {
  test(`${service.name} list returns a defensive snapshot`, async () => {
    const record = await service.create();
    const firstList = await service.list();
    const initialLength = firstList.length;

    firstList.length = 0;
    const secondList = await service.list();

    assert.equal(secondList.length, initialLength);
    assert.ok(secondList.some((item) => item.id === record.id));
  });
}
