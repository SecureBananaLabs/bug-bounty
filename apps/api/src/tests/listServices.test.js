import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createUser, listUsers } from "../services/userService.js";

async function assertListIsDefensive({ create, list, payload }) {
  const created = await create(payload);
  const exposedList = await list();

  exposedList.length = 0;
  exposedList.push({ id: "injected" });

  const freshList = await list();
  assert.ok(freshList.some((item) => item.id === created.id));
  assert.equal(freshList.some((item) => item.id === "injected"), false);
}

test("list services return defensive array copies", async () => {
  await assertListIsDefensive({
    create: createUser,
    list: listUsers,
    payload: { email: "copy-user@example.com", role: "client" }
  });

  await assertListIsDefensive({
    create: createJob,
    list: listJobs,
    payload: {
      title: "Build landing page",
      description: "Create a polished landing page",
      budgetMin: 100,
      budgetMax: 500,
      categoryId: "cat_design",
      skills: ["design"]
    }
  });

  await assertListIsDefensive({
    create: createProposal,
    list: listProposals,
    payload: { jobId: "job_1", freelancerId: "usr_1", bidAmount: 250, coverLetter: "I can help" }
  });

  await assertListIsDefensive({
    create: createReview,
    list: listReviews,
    payload: { reviewerId: "usr_1", revieweeId: "usr_2", rating: 5, comment: "Great work" }
  });

  await assertListIsDefensive({
    create: sendMessage,
    list: listMessages,
    payload: { senderId: "usr_1", receiverId: "usr_2", body: "Hello" }
  });

  await assertListIsDefensive({
    create: createNotification,
    list: listNotifications,
    payload: { userId: "usr_1", title: "Update", body: "You have a new message" }
  });
});
