import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";
import { sendMessage } from "../services/messageService.js";
import { createNotification } from "../services/notificationService.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { createProposal } from "../services/proposalService.js";
import { createReview } from "../services/reviewService.js";
import { createUser } from "../services/userService.js";

async function withPinnedNow(timestamp, run) {
  const original = Date.now;
  Date.now = () => timestamp;

  try {
    await run();
  } finally {
    Date.now = original;
  }
}

test("record services create distinct ids in the same millisecond", async () => {
  await withPinnedNow(1780879000000, async () => {
    const records = [
      await createJob({ title: "Build API", description: "Build a tested API", budgetMin: 1, budgetMax: 2, categoryId: "dev" }),
      await createJob({ title: "Build UI", description: "Build a tested UI", budgetMin: 1, budgetMax: 2, categoryId: "dev" }),
      await createUser({ email: "a@example.com" }),
      await createUser({ email: "b@example.com" }),
      await createProposal({ jobId: "job_1", freelancerId: "usr_1" }),
      await createProposal({ jobId: "job_2", freelancerId: "usr_2" }),
      await sendMessage({ from: "usr_1", to: "usr_2", body: "hello" }),
      await sendMessage({ from: "usr_2", to: "usr_1", body: "hi" }),
      await createReview({ jobId: "job_1", rating: 5 }),
      await createReview({ jobId: "job_2", rating: 4 }),
      await createNotification({ userId: "usr_1", message: "one" }),
      await createNotification({ userId: "usr_2", message: "two" })
    ];

    const ids = records.map((record) => record.id);
    assert.equal(new Set(ids).size, ids.length);
  });
});

test("payment intents create distinct payment ids in the same millisecond", async () => {
  await withPinnedNow(1780879000000, async () => {
    const first = await createPaymentIntent({ amount: 10, currency: "usd" });
    const second = await createPaymentIntent({ amount: 20, currency: "usd" });

    assert.notEqual(first.paymentId, second.paymentId);
    assert.match(first.paymentId, /^pay_1780879000000/);
    assert.match(second.paymentId, /^pay_1780879000000_/);
  });
});
