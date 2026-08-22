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

async function withFrozenClock(callback) {
  const originalDateNow = Date.now;
  Date.now = () => 1234567890;
  try {
    return await callback();
  } finally {
    Date.now = originalDateNow;
  }
}

test("service IDs remain unique within the same millisecond", async () => {
  await withFrozenClock(async () => {
    const factories = [
      {
        prefix: "job",
        create: () => createJob({ title: "Build API", description: "Build a useful API", budgetMin: 1, budgetMax: 2, categoryId: "cat" }),
        idOf: (record) => record.id
      },
      {
        prefix: "msg",
        create: () => sendMessage({ senderId: "usr_a", receiverId: "usr_b", body: "hello" }),
        idOf: (record) => record.id
      },
      {
        prefix: "ntf",
        create: () => createNotification({ userId: "usr_a", body: "hello" }),
        idOf: (record) => record.id
      },
      {
        prefix: "pay",
        create: () => createPaymentIntent({ amount: 10, currency: "usd" }),
        idOf: (record) => record.paymentId
      },
      {
        prefix: "prp",
        create: () => createProposal({ jobId: "job_a", freelancerId: "usr_a", bidAmount: 10 }),
        idOf: (record) => record.id
      },
      {
        prefix: "rev",
        create: () => createReview({ reviewerId: "usr_a", revieweeId: "usr_b", rating: 5 }),
        idOf: (record) => record.id
      },
      {
        prefix: "usr",
        create: () => createUser({ email: "user@example.com", role: "client" }),
        idOf: (record) => record.id
      }
    ];

    for (const factory of factories) {
      const first = factory.idOf(await factory.create());
      const second = factory.idOf(await factory.create());

      assert.match(first, new RegExp(`^${factory.prefix}_`));
      assert.match(second, new RegExp(`^${factory.prefix}_`));
      assert.notEqual(first, second);
    }
  });
});

test("registered user token subject matches the generated user id", async () => {
  await withFrozenClock(async () => {
    const user = await registerUser({
      email: "registered@example.com",
      password: "password123",
      role: "client"
    });
    const tokenPayload = verifyAccessToken(user.token);

    assert.match(user.id, /^usr_/);
    assert.equal(tokenPayload.sub, user.id);
  });
});
