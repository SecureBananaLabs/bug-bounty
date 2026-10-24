import test from "node:test";
import assert from "node:assert/strict";
import { createUser, listUsers } from "../services/userService.js";
import { createJob, listJobs } from "../services/jobService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";

const services = [
  {
    name: "users",
    create: () => createUser({ email: "user@example.com", name: "User" }),
    list: listUsers
  },
  {
    name: "jobs",
    create: () =>
      createJob({
        title: "Build API",
        description: "Build a small API",
        budgetMin: 100,
        budgetMax: 200,
        categoryId: "cat_1"
      }),
    list: listJobs
  },
  {
    name: "proposals",
    create: () =>
      createProposal({
        jobId: "job_1",
        freelancerId: "usr_1",
        bidAmount: 150,
        estimatedDuration: "2 days"
      }),
    list: listProposals
  },
  {
    name: "reviews",
    create: () => createReview({ reviewerId: "usr_1", revieweeId: "usr_2", rating: 5 }),
    list: listReviews
  },
  {
    name: "messages",
    create: () => sendMessage({ senderId: "usr_1", recipientId: "usr_2", content: "hello" }),
    list: listMessages
  },
  {
    name: "notifications",
    create: () => createNotification({ userId: "usr_1", message: "hello" }),
    list: listNotifications
  }
];

for (const service of services) {
  test(`${service.name} list returns a defensive copy`, async () => {
    await service.create();

    const firstList = await service.list();
    const originalLength = firstList.length;
    firstList.push({ id: `injected_${service.name}` });

    const secondList = await service.list();

    assert.equal(secondList.length, originalLength);
    assert.equal(secondList.some((item) => item.id === `injected_${service.name}`), false);
  });
}
