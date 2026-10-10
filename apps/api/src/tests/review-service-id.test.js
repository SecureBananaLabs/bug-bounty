import test from "node:test";
import assert from "node:assert/strict";
import { createReview } from "../services/reviewService.js";

test("createReview ignores caller-supplied id", async () => {
  const result = await createReview({ rating: 5, comment: "Great!", id: "evil-id" });
  assert.notEqual(result.id, "evil-id");
  assert.ok(result.id.startsWith("rev_"));
});
