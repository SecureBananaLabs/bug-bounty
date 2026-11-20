import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";

test("listJobs returns an array snapshot that cannot mutate stored jobs", async () => {
  const first = await createJob({ title: "First job" });
  const second = await createJob({ title: "Second job" });

  const listed = await listJobs();
  assert.equal(listed.length, 2);

  listed.pop();
  listed.length = 0;

  const afterMutation = await listJobs();
  assert.equal(afterMutation.length, 2);
  assert.strictEqual(afterMutation[0], first);
  assert.strictEqual(afterMutation[1], second);
});
