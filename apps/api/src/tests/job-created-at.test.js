import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";

test("createJob adds a server-owned ISO createdAt timestamp", async () => {
  const callerTimestamp = "2000-01-01T00:00:00.000Z";
  const beforeCreate = Date.now();

  const job = await createJob({
    title: "Build a search page",
    description: "Create a searchable freelancer directory.",
    budgetMin: 500,
    budgetMax: 900,
    categoryId: "cat_web",
    skills: ["React"],
    createdAt: callerTimestamp
  });

  const afterCreate = Date.now();
  const createdAt = Date.parse(job.createdAt);

  assert.notEqual(job.createdAt, callerTimestamp);
  assert.equal(new Date(createdAt).toISOString(), job.createdAt);
  assert.ok(createdAt >= beforeCreate);
  assert.ok(createdAt <= afterCreate);

  const storedJobs = await listJobs();
  assert.equal(storedJobs.at(-1).createdAt, job.createdAt);
});
