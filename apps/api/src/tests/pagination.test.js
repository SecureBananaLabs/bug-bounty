import test from "node:test";
import assert from "node:assert/strict";
import { parsePagination } from "../utils/pagination.js";

test("falls back to the documented defaults", () => {
  assert.deepEqual(parsePagination({}), { take: 20, skip: 0 });
  assert.deepEqual(parsePagination(undefined), { take: 20, skip: 0 });
});

test("parses string values from a query string", () => {
  assert.deepEqual(parsePagination({ take: "5", skip: "10" }), { take: 5, skip: 10 });
});

test("clamps the page size to the maximum", () => {
  assert.deepEqual(parsePagination({ take: "500" }), { take: 50, skip: 0 });
  assert.deepEqual(parsePagination({ take: "50" }), { take: 50, skip: 0 });
});

test("supports the limit and offset aliases", () => {
  assert.deepEqual(parsePagination({ limit: "12", offset: "24" }), { take: 12, skip: 24 });
});

test("prefers take and skip over their aliases", () => {
  assert.deepEqual(parsePagination({ take: "3", limit: "9", skip: "6", offset: "9" }), {
    take: 3,
    skip: 6
  });
});

test("repairs out of range and non numeric values", () => {
  assert.deepEqual(parsePagination({ take: "-4", skip: "-8" }), { take: 20, skip: 0 });
  assert.deepEqual(parsePagination({ take: "abc", skip: "" }), { take: 20, skip: 0 });
  assert.deepEqual(parsePagination({ take: "7.9" }), { take: 7, skip: 0 });
});
