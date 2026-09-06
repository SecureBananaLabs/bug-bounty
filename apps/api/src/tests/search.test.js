import test from "node:test";
import assert from "node:assert/strict";
import { searchQuerySchema } from "../validators/search.js";

test("searchQuerySchema accepts a valid query", () => {
  const result = searchQuerySchema.parse("react developer");
  assert.equal(result, "react developer");
});

test("searchQuerySchema trims whitespace", () => {
  const result = searchQuerySchema.parse("  hello world  ");
  assert.equal(result, "hello world");
});

test("searchQuerySchema accepts empty string", () => {
  const result = searchQuerySchema.parse("");
  assert.equal(result, "");
});

test("searchQuerySchema accepts exactly 200 characters", () => {
  const result = searchQuerySchema.parse("a".repeat(200));
  assert.equal(result.length, 200);
});

test("searchQuerySchema rejects query over 200 characters", () => {
  assert.throws(() => searchQuerySchema.parse("a".repeat(201)), /at most 200/);
});

test("searchQuerySchema rejects array input (repeated q params)", () => {
  assert.throws(() => searchQuerySchema.parse(["a", "b"]), /Expected string/);
});

test("searchQuerySchema rejects number input", () => {
  assert.throws(() => searchQuerySchema.parse(123), /Expected string/);
});

test("searchQuerySchema rejects null input", () => {
  assert.throws(() => searchQuerySchema.parse(null), /Expected string/);
});
