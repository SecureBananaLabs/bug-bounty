import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";
import { listMessages, sendMessage } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createUser, listUsers } from "../services/userService.js";

async function assertListReturnsSnapshot({ create, list, payload }) {
  const created = await create(payload);
  const firstList = await list();

  assert.ok(firstList.some((item) => item === created));
  firstList.length = 0;
  firstList.push({ id: "caller_mutation" });

  const secondList = await list();
  assert.ok(secondList.some((item) => item === created));
  assert.equal(secondList.some((item) => item.id === "caller_mutation"), false);
}

test("list service responses are defensive array copies", async () => {
  await assertListReturnsSnapshot({
    create: createUser,
    list: listUsers,
    payload: { email: "copy-user@example.com", role: "client" }
  });
  await assertListReturnsSnapshot({
    create: createJob,
    list: listJobs,
    payload: { title: "Copy test job", budgetMin: 100, budgetMax: 200 }
  });
  await assertListReturnsSnapshot({
    create: createProposal,
    list: listProposals,
    payload: { jobId: "job_copy", freelancerId: "usr_copy", amount: 150 }
  });
  await assertListReturnsSnapshot({
    create: createReview,
    list: listReviews,
    payload: { jobId: "job_copy", rating: 5, comment: "Great work" }
  });
  await assertListReturnsSnapshot({
    create: sendMessage,
    list: listMessages,
    payload: { threadId: "thread_copy", body: "hello" }
  });
  await assertListReturnsSnapshot({
    create: createNotification,
    list: listNotifications,
    payload: { userId: "usr_copy", message: "copy test" }
  });
});
