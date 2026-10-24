import test from "node:test";
import assert from "node:assert/strict";
import {
  MILESTONE_STATUSES,
  VALID_MILESTONE_TRANSITIONS,
  validateMilestoneTransition
} from "../services/contractService.js";

test("Contract milestone state transition validator suite", async (t) => {
  await t.test("Valid lifecycle state transitions return true", () => {
    assert.equal(validateMilestoneTransition("pending", "in_progress"), true);
    assert.equal(validateMilestoneTransition("in_progress", "submitted"), true);
    assert.equal(validateMilestoneTransition("submitted", "approved"), true);
    assert.equal(validateMilestoneTransition("approved", "paid"), true);
  });

  await t.test("Invalid reverse and skip transitions return false", () => {
    // Backward transitions
    assert.equal(validateMilestoneTransition("approved", "pending"), false);
    assert.equal(validateMilestoneTransition("submitted", "in_progress"), false);
    assert.equal(validateMilestoneTransition("paid", "approved"), false);
    assert.equal(validateMilestoneTransition("paid", "pending"), false);

    // Skip transitions
    assert.equal(validateMilestoneTransition("pending", "approved"), false);
    assert.equal(validateMilestoneTransition("pending", "paid"), false);
    assert.equal(validateMilestoneTransition("in_progress", "paid"), false);

    // Same state transition
    assert.equal(validateMilestoneTransition("pending", "pending"), false);
    assert.equal(validateMilestoneTransition("in_progress", "in_progress"), false);
  });

  await t.test("Terminal state 'paid' has no valid transitions", () => {
    for (const status of MILESTONE_STATUSES) {
      assert.equal(
        validateMilestoneTransition("paid", status),
        false,
        `paid -> ${status} must return false`
      );
    }
  });

  await t.test("Handles casing, whitespace, and invalid inputs gracefully", () => {
    assert.equal(validateMilestoneTransition("PENDING", "IN_PROGRESS"), true);
    assert.equal(validateMilestoneTransition("  pending  ", "  in_progress  "), true);
    assert.equal(validateMilestoneTransition(null, "in_progress"), false);
    assert.equal(validateMilestoneTransition("pending", undefined), false);
    assert.equal(validateMilestoneTransition("", "pending"), false);
    assert.equal(validateMilestoneTransition(123, "in_progress"), false);
    assert.equal(validateMilestoneTransition("invalid_state", "in_progress"), false);
    assert.equal(validateMilestoneTransition("pending", "unknown"), false);
  });
});
