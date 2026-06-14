import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createUser, listUsers } from "../services/userService.js";

const listServiceCases = [
  {
    name: "users",
    create: () => createUser({ email: "copy-user@example.com", fullName: "Copy User" }),
    list: listUsers
  },
  {
    name: "jobs",
    create: () => createJob({ title: "Copy safe job", description: "Protect list response state" }),
    list: listJobs
  },
  {
    name: "proposals",
    create: () => createProposal({ jobId: "job_copy", freelancerId: "usr_copy", bid: 100 }),
    list: listProposals
  },
  {
    name: "reviews",
    create: () => createReview({ reviewerId: "usr_a", revieweeId: "usr_b", rating: 5 }),
    list: listReviews
  },
  {
    name: "messages",
    create: () => sendMessage({ senderId: "usr_a", recipientId: "usr_b", body: "hello" }),
    list: listMessages
  },
  {
    name: "notifications",
    create: () => createNotification({ userId: "usr_a", type: "system", message: "hello" }),
    list: listNotifications
  }
];

for (const serviceCase of listServiceCases) {
  test(`${serviceCase.name} list responses cannot mutate backing store`, async () => {
    const created = await serviceCase.create();
    const firstList = await serviceCase.list();

    firstList[0].id = `${serviceCase.name}_edited`;
    firstList.push({ id: `${serviceCase.name}_injected` });
    firstList.pop();
    firstList.length = 0;

    const secondList = await serviceCase.list();
    assert.ok(secondList.some((entry) => entry.id === created.id));
    assert.equal(secondList.some((entry) => entry.id === `${serviceCase.name}_injected`), false);
  });
}
