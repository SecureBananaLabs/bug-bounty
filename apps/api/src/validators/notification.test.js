import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateCreateNotification } from "./notification.js";

describe("Notification Validation (#743)", () => {
  it("rejects empty notification payload or missing userId", () => {
    const res1 = validateCreateNotification({});
    assert.equal(res1.ok, false);
    assert.equal(res1.error, "userId is required");

    const res2 = validateCreateNotification({ userId: "" });
    assert.equal(res2.ok, false);
    assert.equal(res2.error, "userId is required");
  });

  it("rejects short title or short body", () => {
    const res1 = validateCreateNotification({
      userId: "user_123",
      title: "A",
      body: "Valid body text"
    });
    assert.equal(res1.ok, false);
    assert.equal(res1.error, "Title must be at least 2 characters");

    const res2 = validateCreateNotification({
      userId: "user_123",
      title: "Job Accepted",
      body: ""
    });
    assert.equal(res2.ok, false);
    assert.equal(res2.error, "Body must be at least 2 characters");
  });

  it("accepts valid notification payload", () => {
    const res = validateCreateNotification({
      userId: "user_123",
      title: "Proposal Accepted",
      body: "Your proposal for Job #42 was accepted by the client."
    });
    assert.equal(res.ok, true);
    assert.equal(res.data.userId, "user_123");
    assert.equal(res.data.title, "Proposal Accepted");
  });
});
