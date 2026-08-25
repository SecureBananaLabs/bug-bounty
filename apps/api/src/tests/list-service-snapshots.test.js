import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import {
  createNotification,
  listNotifications,
} from "../services/notificationService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createUser, listUsers } from "../services/userService.js";

const cases = [
  {
    name: "jobs",
    create: () =>
      createJob({
        title: "Build dashboard",
        description: "Build an analytics dashboard",
        budgetMin: 100,
        budgetMax: 200,
        categoryId: "web",
        skills: [],
      }),
    list: listJobs,
  },
  {
    name: "messages",
    create: () =>
      sendMessage({
        senderId: "usr_1",
        recipientId: "usr_2",
        body: "hello",
      }),
    list: listMessages,
  },
  {
    name: "notifications",
    create: () => createNotification({ title: "Update" }),
    list: listNotifications,
  },
  {
    name: "proposals",
    create: () => createProposal({ jobId: "job_1", freelancerId: "usr_1" }),
    list: listProposals,
  },
  {
    name: "reviews",
    create: () => createReview({ reviewerId: "usr_1", rating: 5 }),
    list: listReviews,
  },
  {
    name: "users",
    create: () => createUser({ email: "person@example.com" }),
    list: listUsers,
  },
];

for (const service of cases) {
  test(`${service.name} list returns a defensive array snapshot`, async () => {
    const created = await service.create();
    const snapshot = await service.list();

    snapshot.length = 0;

    const nextList = await service.list();
    assert.equal(
      nextList.some((item) => item.id === created.id),
      true
    );
  });
}
