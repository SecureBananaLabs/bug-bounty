import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createUser, listUsers } from "../services/userService.js";

const services = [
  {
    name: "jobs",
    create: () =>
      createJob({
        title: "Snapshot Test Job",
        description: "A job used to verify list snapshot behavior.",
        budgetMin: 10,
        budgetMax: 20,
        categoryId: "cat_snapshot",
        skills: ["testing"]
      }),
    list: listJobs
  },
  {
    name: "messages",
    create: () =>
      sendMessage({
        senderId: "usr_snapshot_sender",
        receiverId: "usr_snapshot_receiver",
        body: "hello"
      }),
    list: listMessages
  },
  {
    name: "notifications",
    create: () =>
      createNotification({
        userId: "usr_snapshot",
        message: "hello"
      }),
    list: listNotifications
  },
  {
    name: "proposals",
    create: () =>
      createProposal({
        jobId: "job_snapshot",
        freelancerId: "usr_snapshot_freelancer",
        bidAmount: 100
      }),
    list: listProposals
  },
  {
    name: "reviews",
    create: () =>
      createReview({
        reviewerId: "usr_snapshot_reviewer",
        revieweeId: "usr_snapshot_reviewee",
        rating: 5,
        comment: "Great work"
      }),
    list: listReviews
  },
  {
    name: "users",
    create: () =>
      createUser({
        name: "Snapshot User",
        email: "snapshot@example.com",
        role: "client"
      }),
    list: listUsers
  }
];

for (const service of services) {
  test(`${service.name} list returns a defensive snapshot`, async () => {
    const created = await service.create();
    const firstList = await service.list();

    assert.ok(firstList.some((item) => item === created));

    const injectedRecord = { id: `${service.name}_injected` };
    firstList.push(injectedRecord);

    const secondList = await service.list();

    assert.ok(secondList.some((item) => item === created));
    assert.ok(!secondList.some((item) => item === injectedRecord));
  });
}
