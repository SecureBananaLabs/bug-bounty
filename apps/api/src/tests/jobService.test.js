import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";

test("createJob adds a server-owned createdAt timestamp", async () => {
  const before = Date.now();
  const initialJobCount = (await listJobs()).length;

  const job = await createJob({
    title: "Build landing page",
    description: "Create the marketing landing page",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "cat_web",
    skills: ["react"],
    createdAt: "2000-01-01T00:00:00.000Z"
  });

  const after = Date.now();
  const createdAtTime = Date.parse(job.createdAt);
  const jobs = await listJobs();

  assert.equal(typeof job.createdAt, "string");
  assert.ok(Number.isFinite(createdAtTime));
  assert.ok(createdAtTime >= before);
  assert.ok(createdAtTime <= after);
  assert.notEqual(job.createdAt, "2000-01-01T00:00:00.000Z");
  assert.equal(jobs.length, initialJobCount + 1);
  assert.equal(jobs.at(-1), job);
  assert.equal(jobs.at(-1).createdAt, job.createdAt);
});
