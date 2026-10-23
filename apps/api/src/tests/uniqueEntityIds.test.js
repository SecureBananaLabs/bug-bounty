import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createNotification } from "../services/notificationService.js";
import { sendMessage } from "../services/messageService.js";
import { createReview } from "../services/reviewService.js";
import { createUser } from "../services/userService.js";

describe("Collision-Resistant Cryptographic Entity IDs (#13079, #2262)", () => {
  it("generates distinct ntf_ notification IDs within the same millisecond and preserves read:false default", async () => {
    const originalNow = Date.now;
    Date.now = () => 1700000000000;
    try {
      const n1 = await createNotification({ userId: "u1", message: "First" });
      const n2 = await createNotification({ userId: "u1", message: "Second" });

      assert.match(n1.id, /^ntf_[0-9a-f-]{36}$/);
      assert.match(n2.id, /^ntf_[0-9a-f-]{36}$/);
      assert.notEqual(n1.id, n2.id);
      assert.equal(n1.read, false);
    } finally {
      Date.now = originalNow;
    }
  });

  it("generates distinct msg_, rev_, and usr_ IDs within the same millisecond", async () => {
    const originalNow = Date.now;
    Date.now = () => 1700000000000;
    try {
      const m1 = await sendMessage({ senderId: "u1", text: "Hi" });
      const m2 = await sendMessage({ senderId: "u1", text: "Hello" });
      assert.match(m1.id, /^msg_[0-9a-f-]{36}$/);
      assert.notEqual(m1.id, m2.id);

      const r1 = await createReview({ rating: 5 });
      const r2 = await createReview({ rating: 4 });
      assert.match(r1.id, /^rev_[0-9a-f-]{36}$/);
      assert.notEqual(r1.id, r2.id);

      const u1 = await createUser({ email: "a@example.com" });
      const u2 = await createUser({ email: "b@example.com" });
      assert.match(u1.id, /^usr_[0-9a-f-]{36}$/);
      assert.notEqual(u1.id, u2.id);
    } finally {
      Date.now = originalNow;
    }
  });
});
