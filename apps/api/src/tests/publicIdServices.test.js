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
import { resetPublicIdState } from "../utils/publicId.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("services generate distinct public ids within the same millisecond", async (t) => {
  const originalNow = Date.now;
  Date.now = () => 1780879000000;
  resetPublicIdState();

  await t.test("registerUser reuses the generated user id in the JWT subject", async () => {
    const first = await registerUser({
      email: "one@example.com",
      password: "password123",
      role: "client"
    });
    const second = await registerUser({
      email: "two@example.com",
      password: "password123",
      role: "freelancer"
    });

    assert.equal(first.id, "usr_1780879000000");
    assert.equal(second.id, "usr_1780879000000_1");
    assert.equal(verifyAccessToken(first.token).sub, first.id);
    assert.equal(verifyAccessToken(second.token).sub, second.id);
  });

  await t.test("in-memory services append a sequence suffix when ids collide", async () => {
    const [userA, userB] = await Promise.all([
      createUser({ email: "a@example.com" }),
      createUser({ email: "b@example.com" })
    ]);
    const [jobA, jobB] = await Promise.all([
      createJob({ title: "Job A" }),
      createJob({ title: "Job B" })
    ]);
    const [proposalA, proposalB] = await Promise.all([
      createProposal({ bidAmount: 1 }),
      createProposal({ bidAmount: 2 })
    ]);
    const [messageA, messageB] = await Promise.all([
      sendMessage({ body: "hello" }),
      sendMessage({ body: "world" })
    ]);
    const [reviewA, reviewB] = await Promise.all([
      createReview({ rating: 5 }),
      createReview({ rating: 4 })
    ]);
    const [notificationA, notificationB] = await Promise.all([
      createNotification({ title: "one" }),
      createNotification({ title: "two" })
    ]);
    const [paymentA, paymentB] = await Promise.all([
      createPaymentIntent({ amount: 10 }),
      createPaymentIntent({ amount: 20 })
    ]);

    assert.equal(userA.id, "usr_1780879000000_2");
    assert.equal(userB.id, "usr_1780879000000_3");
    assert.equal(jobA.id, "job_1780879000000");
    assert.equal(jobB.id, "job_1780879000000_1");
    assert.equal(proposalA.id, "prp_1780879000000");
    assert.equal(proposalB.id, "prp_1780879000000_1");
    assert.equal(messageA.id, "msg_1780879000000");
    assert.equal(messageB.id, "msg_1780879000000_1");
    assert.equal(reviewA.id, "rev_1780879000000");
    assert.equal(reviewB.id, "rev_1780879000000_1");
    assert.equal(notificationA.id, "ntf_1780879000000");
    assert.equal(notificationB.id, "ntf_1780879000000_1");
    assert.equal(paymentA.paymentId, "pay_1780879000000");
    assert.equal(paymentB.paymentId, "pay_1780879000000_1");
  });

  Date.now = originalNow;
});
