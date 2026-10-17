import test from "node:test";
import assert from "node:assert/strict";
import { searchQuerySchema } from "../validators/search.js";

test("searchQuerySchema trims search queries", () => {
  assert.equal(searchQuerySchema.parse("  designer  "), "designer");
});

test("searchQuerySchema defaults missing search query to empty string", () => {
  assert.equal(searchQuerySchema.parse(undefined), "");
});

test("searchQuerySchema rejects search queries longer than 200 characters", () => {
  assert.equal(searchQuerySchema.safeParse("a".repeat(201)).success, false);
});
