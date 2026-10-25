import test from "node:test";
import assert from "node:assert/strict";
import { searchQuerySchema } from "../validators/search.js";

test("searchQuerySchema accepts valid query", () => {
  const result = searchQuerySchema.safeParse({ q: "javascript developer" });
  assert.equal(result.success, true);
  assert.equal(result.data.q, "javascript developer");
});

test("searchQuerySchema accepts empty query", () => {
  const result = searchQuerySchema.safeParse({ q: "" });
  assert.equal(result.success, true);
  assert.equal(result.data.q, "");
});

test("searchQuerySchema rejects query over 200 characters", () => {
  const longQuery = "a".repeat(201);
  const result = searchQuerySchema.safeParse({ q: longQuery });
  assert.equal(result.success, false);
  assert.ok(result.error.errors[0].message.includes("200"));
});

test("searchQuerySchema accepts query exactly 200 characters", () => {
  const exactQuery = "a".repeat(200);
  const result = searchQuerySchema.safeParse({ q: exactQuery });
  assert.equal(result.success, true);
});

test("searchQuerySchema rejects non-string query", () => {
  const result = searchQuerySchema.safeParse({ q: 123 });
  assert.equal(result.success, false);
});
