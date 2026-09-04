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
import { verifyAccessToken } from "../utils/jwt.js";

const jobPayload = {
  title: "Build integration",
  description: "Build a tested API integration",
  budgetMin: 100,
  budgetMax: 200,
  categoryId: "cat_1",
  skills: ["node"]
};

test("service-generated ids remain unique when records are created in the same millisecond", async (t) => {
  const originalNow = Date.now;
  Date.now = () => 1710000000000;
  t.after(() => {
    Date.now = originalNow;
  });

  const records = await Promise.all([
    createJob(jobPayload),
    createJob(jobPayload),
    sendMessage({ senderId: "usr_a", receiverId: "usr_b", body: "hello" }),
    sendMessage({ senderId: "usr_a", receiverId: "usr_b", body: "again" }),
    createNotification({ userId: "usr_a", title: "Proposal", body: "Updated" }),
    createNotification({ userId: "usr_a", title: "Payment", body: "Released" }),
    createProposal({ jobId: "job_a", freelancerId: "usr_b", coverLetter: "I can help", bidAmount: 150, estDuration: "1 week" }),
    createProposal({ jobId: "job_a", freelancerId: "usr_c", coverLetter: "Available today", bidAmount: 175, estDuration: "2 weeks" }),
    createReview({ reviewerId: "usr_a", revieweeId: "usr_b", rating: 5, comment: "Great" }),
    createReview({ reviewerId: "usr_c", revieweeId: "usr_b", rating: 4, comment: "Good" }),
    createUser({ email: "one@example.com", password: "password123", role: "client" }),
    createUser({ email: "two@example.com", password: "password123", role: "client" })
  ]);

  const ids = records.map((record) => record.id);
  assert.equal(new Set(ids).size, ids.length);
  assert(ids.every((id) => /^[a-z]{3}_[0-9a-f-]{36}$/.test(id)));

  const payments = await Promise.all([
    createPaymentIntent({ amount: 100, currency: "usd" }),
    createPaymentIntent({ amount: 100, currency: "usd" })
  ]);
  const paymentIds = payments.map((payment) => payment.paymentId);
  assert.equal(new Set(paymentIds).size, paymentIds.length);
  assert(paymentIds.every((id) => /^pay_[0-9a-f-]{36}$/.test(id)));
});

test("registration reuses the generated user id as the token subject", async () => {
  const result = await registerUser({
    email: "new.user@example.com",
    password: "password123",
    role: "client"
  });

  const decoded = verifyAccessToken(result.token);
  assert.equal(decoded.sub, result.id);
});
