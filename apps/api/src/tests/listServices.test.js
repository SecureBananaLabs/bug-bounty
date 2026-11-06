import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";
import { sendMessage, listMessages } from "../services/messageService.js";
import { createNotification, listNotifications } from "../services/notificationService.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createReview, listReviews } from "../services/reviewService.js";
import { createUser, listUsers } from "../services/userService.js";

async function assertDefensiveList({ create, list, payload, field }) {
  const record = await create(payload);
  const firstList = await list();
  const baselineLength = firstList.length;
  const returnedRecord = firstList.find((item) => item.id === record.id);

  assert.ok(returnedRecord);

  firstList.push({ id: "client-injected-record" });
  returnedRecord[field] = "client-mutated-value";

  const secondList = await list();
  const storedRecord = secondList.find((item) => item.id === record.id);

  assert.equal(secondList.length, baselineLength);
  assert.equal(storedRecord[field], payload[field]);
}

test("list services do not expose mutable backing arrays or records", async () => {
  await assertDefensiveList({
    create: createUser,
    list: listUsers,
    payload: { name: "Ada" },
    field: "name"
  });

  await assertDefensiveList({
    create: createJob,
    list: listJobs,
    payload: {
      title: "Build API",
      description: "Create a stable marketplace API",
      budgetMin: 100,
      budgetMax: 300,
      categoryId: "backend",
      skills: ["node"]
    },
    field: "title"
  });

  await assertDefensiveList({
    create: createProposal,
    list: listProposals,
    payload: { jobId: "job_1", freelancerId: "usr_1", coverLetter: "I can help" },
    field: "coverLetter"
  });

  await assertDefensiveList({
    create: createReview,
    list: listReviews,
    payload: { jobId: "job_1", reviewerId: "usr_1", rating: 5, comment: "Great work" },
    field: "comment"
  });

  await assertDefensiveList({
    create: sendMessage,
    list: listMessages,
    payload: { from: "usr_1", to: "usr_2", body: "Hello" },
    field: "body"
  });

  await assertDefensiveList({
    create: createNotification,
    list: listNotifications,
    payload: { userId: "usr_1", message: "New update" },
    field: "message"
  });
});
