import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { createJob } from "../services/jobService.js";
import { sendMessage } from "../services/messageService.js";
import { createNotification } from "../services/notificationService.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { createProposal } from "../services/proposalService.js";
import { createReview } from "../services/reviewService.js";
import { createUser } from "../services/userService.js";
import { createId, resetIdSequencesForTests } from "../utils/id.js";
import { verifyAccessToken } from "../utils/jwt.js";

async function withFixedTimestamp(timestamp, callback) {
  const originalNow = Date.now;
  Date.now = () => timestamp;
  resetIdSequencesForTests();

  try {
    return await callback();
  } finally {
    Date.now = originalNow;
    resetIdSequencesForTests();
  }
}

test("createId adds same-millisecond sequence suffixes per prefix", async () => {
  await withFixedTimestamp(1782460000000, () => {
    assert.equal(createId("usr"), "usr_1782460000000");
    assert.equal(createId("usr"), "usr_1782460000000_1");
    assert.equal(createId("job"), "job_1782460000000");
    assert.equal(createId("job"), "job_1782460000000_1");
  });
});

test("service generated IDs remain unique within one millisecond", async () => {
  await withFixedTimestamp(1782460000001, async () => {
    const users = [
      await createUser({ email: "first@example.com" }),
      await createUser({ email: "second@example.com" })
    ];
    const jobs = [
      await createJob({ title: "One" }),
      await createJob({ title: "Two" })
    ];
    const proposals = [
      await createProposal({ jobId: "job_1" }),
      await createProposal({ jobId: "job_2" })
    ];
    const reviews = [
      await createReview({ targetId: "usr_1" }),
      await createReview({ targetId: "usr_2" })
    ];
    const messages = [
      await sendMessage({ body: "One" }),
      await sendMessage({ body: "Two" })
    ];
    const notifications = [
      await createNotification({ message: "One" }),
      await createNotification({ message: "Two" })
    ];
    const payments = [
      await createPaymentIntent({ amount: 100 }),
      await createPaymentIntent({ amount: 200 })
    ];

    const ids = [
      ...users.map((user) => user.id),
      ...jobs.map((job) => job.id),
      ...proposals.map((proposal) => proposal.id),
      ...reviews.map((review) => review.id),
      ...messages.map((message) => message.id),
      ...notifications.map((notification) => notification.id),
      ...payments.map((payment) => payment.paymentId)
    ];

    assert.equal(new Set(ids).size, ids.length);
  });
});

test("registered user token subject matches the generated user id", async () => {
  await withFixedTimestamp(1782460000002, async () => {
    const user = await registerUser({
      email: "registered@example.com",
      password: "password123",
      role: "client"
    });
    const token = verifyAccessToken(user.token);

    assert.equal(token.sub, user.id);
    assert.equal(user.id, "usr_1782460000002");
  });
});
