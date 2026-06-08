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

async function withFixedNow(timestamp, callback) {
  const originalNow = Date.now;
  Date.now = () => timestamp;

  try {
    return await callback();
  } finally {
    Date.now = originalNow;
  }
}

function assertSameMillisecondIds(first, second, key, prefix, timestamp) {
  assert.notEqual(first[key], second[key]);
  assert.match(first[key], new RegExp(`^${prefix}_${timestamp}(?:_\\d+)?$`));
  assert.match(second[key], new RegExp(`^${prefix}_${timestamp}(?:_\\d+)?$`));
}

test("record services create unique ids within the same millisecond", async () => {
  const timestamp = 1780879000000;

  await withFixedNow(timestamp, async () => {
    assertSameMillisecondIds(
      await createJob({ title: "One" }),
      await createJob({ title: "Two" }),
      "id",
      "job",
      timestamp
    );
    assertSameMillisecondIds(
      await createUser({ email: "one@example.com" }),
      await createUser({ email: "two@example.com" }),
      "id",
      "usr",
      timestamp
    );
    assertSameMillisecondIds(
      await createProposal({ jobId: "job_1", freelancerId: "usr_1" }),
      await createProposal({ jobId: "job_1", freelancerId: "usr_2" }),
      "id",
      "prp",
      timestamp
    );
    assertSameMillisecondIds(
      await sendMessage({ senderId: "usr_1", recipientId: "usr_2", content: "One" }),
      await sendMessage({ senderId: "usr_2", recipientId: "usr_1", content: "Two" }),
      "id",
      "msg",
      timestamp
    );
    assertSameMillisecondIds(
      await createReview({ rating: 5, reviewerId: "usr_1", revieweeId: "usr_2" }),
      await createReview({ rating: 4, reviewerId: "usr_2", revieweeId: "usr_1" }),
      "id",
      "rev",
      timestamp
    );
    assertSameMillisecondIds(
      await createNotification({ recipientId: "usr_1", message: "One" }),
      await createNotification({ recipientId: "usr_2", message: "Two" }),
      "id",
      "ntf",
      timestamp
    );
    assertSameMillisecondIds(
      await createPaymentIntent({ amount: 1000 }),
      await createPaymentIntent({ amount: 2000 }),
      "paymentId",
      "pay",
      timestamp
    );
  });
});

test("registration uses the same generated user id in the access token", async () => {
  const timestamp = 1780879000001;

  await withFixedNow(timestamp, async () => {
    const first = await registerUser({ email: "one@example.com", role: "client" });
    const second = await registerUser({ email: "two@example.com", role: "client" });

    assertSameMillisecondIds(first, second, "id", "usr", timestamp);
    assert.equal(verifyAccessToken(first.token).sub, first.id);
    assert.equal(verifyAccessToken(second.token).sub, second.id);
  });
});
