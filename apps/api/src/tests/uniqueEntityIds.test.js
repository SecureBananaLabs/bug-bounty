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

  it("ignores caller-supplied id overrides and handles non-plain-object payloads safely", async () => {
    const ntf = await createNotification({ id: "ntf_fake", message: "Alert" });
    const msg = await sendMessage("not-an-object");
    const rev = await createReview(["invalid"]);
    const usr = await createUser(null);

    assert.notEqual(ntf.id, "ntf_fake");
    assert.match(msg.id, /^msg_[0-9a-f-]{36}$/);
    assert.equal(Object.prototype.hasOwnProperty.call(msg, "0"), false);
    assert.equal(Object.prototype.hasOwnProperty.call(rev, "0"), false);
    assert.match(usr.id, /^usr_[0-9a-f-]{36}$/);
  });
});
