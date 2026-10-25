import assert from "node:assert/strict";
import test from "node:test";

import { findJobById } from "../../../../apps/web/lib/jobLookup.mjs";

const fixture = [
  { id: "job-101", title: "Support widget", budget: "$1,500" },
  { id: "job-102", title: "Legacy API migration", budget: "$2,800" }
];

test("job detail lookup resolves the stored mock job", () => {
  const job = findJobById(fixture, "job-102");

  assert.equal(job.title, "Legacy API migration");
  assert.equal(job.budget, "$2,800");
});

test("job detail lookup trims the incoming route id", () => {
  assert.equal(findJobById(fixture, "  job-101  ").id, "job-101");
});

test("job detail lookup falls back for unknown or empty ids", () => {
  assert.equal(findJobById(fixture, "job-999"), undefined);
  assert.equal(findJobById(fixture, ""), undefined);
  assert.equal(findJobById(fixture, undefined), undefined);
});
