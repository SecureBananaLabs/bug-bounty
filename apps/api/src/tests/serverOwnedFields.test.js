import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";
import { sendMessage } from "../services/messageService.js";
import { createNotification } from "../services/notificationService.js";
import { createProposal } from "../services/proposalService.js";
import { createReview } from "../services/reviewService.js";
import { createUser } from "../services/userService.js";

async function withFixedNow(timestamp, callback) {
  const originalNow = Date.now;
  Date.now = () => timestamp;
  try {
    return await callback();
  } finally {
    Date.now = originalNow;
  }
}

test("createJob keeps generated id and open status over payload fields", async () => {
  const job = await withFixedNow(1_700_000_000_001, () =>
    createJob({
      id: "job_client_supplied",
      status: "closed",
      title: "Build an API",
      description: "Implement the new API contract",
      budgetMin: 100,
      budgetMax: 200
    })
  );

  assert.equal(job.id, "job_1700000000001");
  assert.equal(job.status, "open");
  assert.equal(job.title, "Build an API");
});

test("createNotification keeps generated id and unread state over payload fields", async () => {
  const notification = await withFixedNow(1_700_000_000_002, () =>
    createNotification({
      id: "ntf_client_supplied",
      read: true,
      userId: "usr_1",
      title: "New proposal"
    })
  );

  assert.equal(notification.id, "ntf_1700000000002");
  assert.equal(notification.read, false);
  assert.equal(notification.title, "New proposal");
});

test("create services ignore client-supplied ids", async () => {
  const records = await withFixedNow(1_700_000_000_003, async () => ({
    user: await createUser({ id: "usr_client_supplied", email: "user@example.com" }),
    proposal: await createProposal({ id: "prp_client_supplied", jobId: "job_1" }),
    review: await createReview({ id: "rev_client_supplied", rating: 5 }),
    message: await sendMessage({
      id: "msg_client_supplied",
      sentAt: "1999-01-01T00:00:00.000Z",
      body: "hello"
    })
  }));

  assert.equal(records.user.id, "usr_1700000000003");
  assert.equal(records.proposal.id, "prp_1700000000003");
  assert.equal(records.review.id, "rev_1700000000003");
  assert.equal(records.message.id, "msg_1700000000003");
  assert.notEqual(records.message.sentAt, "1999-01-01T00:00:00.000Z");
  assert.equal(records.message.body, "hello");
});
