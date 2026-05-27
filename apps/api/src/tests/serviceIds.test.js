import test from "node:test";
import assert from "node:assert/strict";
import { sendMessage } from "../services/messageService.js";
import { createNotification } from "../services/notificationService.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { createProposal } from "../services/proposalService.js";
import { createReview } from "../services/reviewService.js";

const uuidSuffix = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

test("activity services assign distinct IDs when records are created in the same millisecond", async (t) => {
  const originalNow = Date.now;
  t.after(() => {
    Date.now = originalNow;
  });
  Date.now = () => 1_779_893_200_000;

  const pairs = [
    {
      prefix: "msg",
      key: "id",
      records: [
        await sendMessage({ senderId: "usr_a", receiverId: "usr_b", body: "first" }),
        await sendMessage({ senderId: "usr_a", receiverId: "usr_b", body: "second" })
      ]
    },
    {
      prefix: "prp",
      key: "id",
      records: [
        await createProposal({ jobId: "job_1", freelancerId: "usr_a", bidAmount: 100 }),
        await createProposal({ jobId: "job_1", freelancerId: "usr_b", bidAmount: 120 })
      ]
    },
    {
      prefix: "rev",
      key: "id",
      records: [
        await createReview({ jobId: "job_1", reviewerId: "usr_a", revieweeId: "usr_b", rating: 5 }),
        await createReview({ jobId: "job_1", reviewerId: "usr_c", revieweeId: "usr_b", rating: 4 })
      ]
    },
    {
      prefix: "ntf",
      key: "id",
      records: [
        await createNotification({ userId: "usr_a", type: "message", message: "first" }),
        await createNotification({ userId: "usr_a", type: "message", message: "second" })
      ]
    },
    {
      prefix: "pay",
      key: "paymentId",
      records: [
        await createPaymentIntent({ amount: 1000, currency: "usd" }),
        await createPaymentIntent({ amount: 1000, currency: "usd" })
      ]
    }
  ];

  for (const { prefix, key, records } of pairs) {
    assert.match(records[0][key], new RegExp(`^${prefix}_${uuidSuffix}$`));
    assert.match(records[1][key], new RegExp(`^${prefix}_${uuidSuffix}$`));
    assert.notEqual(records[0][key], records[1][key]);
  }
});
