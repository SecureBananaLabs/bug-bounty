import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";
import { sendMessage } from "../services/messageService.js";
import { createNotification } from "../services/notificationService.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { createProposal } from "../services/proposalService.js";
import { createReview } from "../services/reviewService.js";
import { createUser } from "../services/userService.js";

function assertServiceId(value, prefix) {
  assert.match(value, new RegExp(`^${prefix}_[0-9a-f-]{36}$`));
}

test("service ids stay unique when records are created in the same millisecond", async () => {
  const originalNow = Date.now;
  Date.now = () => 1234567890;

  try {
    const first = await createJob({
      title: "Build API",
      description: "Build the first API",
      budgetMin: 100,
      budgetMax: 200,
      categoryId: "engineering"
    });
    const second = await createJob({
      title: "Build UI",
      description: "Build the second UI",
      budgetMin: 200,
      budgetMax: 300,
      categoryId: "design"
    });

    assertServiceId(first.id, "job");
    assertServiceId(second.id, "job");
    assert.notEqual(first.id, second.id);
  } finally {
    Date.now = originalNow;
  }
});

test("service-owned fields cannot be overridden by caller payloads", async () => {
  const user = await createUser({ id: "usr_attacker", email: "a@example.com" });
  const proposal = await createProposal({ id: "prp_attacker", jobId: "job_1" });
  const review = await createReview({ id: "rev_attacker", rating: 5 });
  const notification = await createNotification({
    id: "ntf_attacker",
    read: true,
    userId: "usr_1",
    message: "Hello"
  });
  const message = await sendMessage({
    id: "msg_attacker",
    sentAt: "2000-01-01T00:00:00.000Z",
    to: "usr_2",
    text: "Hello"
  });
  const payment = await createPaymentIntent({ amount: 100, currency: "aud" });

  assertServiceId(user.id, "usr");
  assertServiceId(proposal.id, "prp");
  assertServiceId(review.id, "rev");
  assertServiceId(notification.id, "ntf");
  assertServiceId(message.id, "msg");
  assertServiceId(payment.paymentId, "pay");

  assert.equal(notification.read, false);
  assert.notEqual(message.sentAt, "2000-01-01T00:00:00.000Z");
  assert.equal(payment.amount, 100);
  assert.equal(payment.currency, "aud");
});
