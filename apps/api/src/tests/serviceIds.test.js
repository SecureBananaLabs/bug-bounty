import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { registerUser } from "../services/authService.js";
import { createJob } from "../services/jobService.js";
import { sendMessage } from "../services/messageService.js";
import { createNotification } from "../services/notificationService.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { createProposal } from "../services/proposalService.js";
import { createReview } from "../services/reviewService.js";
import { createUser } from "../services/userService.js";

function assertUniquePrefixedIds(first, second, prefix) {
  assert.match(first, new RegExp(`^${prefix}_[0-9a-f-]{36}$`));
  assert.match(second, new RegExp(`^${prefix}_[0-9a-f-]{36}$`));
  assert.notEqual(first, second);
}

test("service-generated ids stay unique when resources are created back-to-back", async () => {
  const [firstUser, secondUser] = await Promise.all([
    createUser({ email: "first@example.com", fullName: "First" }),
    createUser({ email: "second@example.com", fullName: "Second" })
  ]);
  const [firstPayment, secondPayment] = await Promise.all([
    createPaymentIntent({ amount: 10 }),
    createPaymentIntent({ amount: 20 })
  ]);

  assertUniquePrefixedIds(firstUser.id, secondUser.id, "usr");
  assertUniquePrefixedIds(firstPayment.paymentId, secondPayment.paymentId, "pay");
});

test("create paths keep lifecycle fields server-owned", async () => {
  const job = await createJob({ id: "job_caller", status: "closed", title: "Build API" });
  const message = await sendMessage({ id: "msg_caller", sentAt: "2000-01-01T00:00:00.000Z", body: "hello" });
  const notification = await createNotification({ id: "ntf_caller", read: true, message: "hello" });
  const proposal = await createProposal({ id: "prp_caller", coverLetter: "hello" });
  const review = await createReview({ id: "rev_caller", rating: 5 });
  const user = await createUser({ id: "usr_caller", email: "maya@example.com", fullName: "Maya" });
  const payment = await createPaymentIntent({ paymentId: "pay_caller", amount: 30, provider: "caller" });

  assert.match(job.id, /^job_[0-9a-f-]{36}$/);
  assert.equal(job.status, "open");
  assert.match(message.id, /^msg_[0-9a-f-]{36}$/);
  assert.notEqual(message.sentAt, "2000-01-01T00:00:00.000Z");
  assert.match(notification.id, /^ntf_[0-9a-f-]{36}$/);
  assert.equal(notification.read, false);
  assert.match(proposal.id, /^prp_[0-9a-f-]{36}$/);
  assert.match(review.id, /^rev_[0-9a-f-]{36}$/);
  assert.match(user.id, /^usr_[0-9a-f-]{36}$/);
  assert.match(payment.paymentId, /^pay_[0-9a-f-]{36}$/);
  assert.equal(payment.provider, "stripe");
});

test("registration returns one generated user id and signs the same subject", async () => {
  const user = await registerUser({
    email: "registered@example.com",
    role: "client"
  });
  const decoded = jwt.decode(user.token);

  assert.match(user.id, /^usr_[0-9a-f-]{36}$/);
  assert.equal(decoded.sub, user.id);
  assert.equal(decoded.role, "client");
});
