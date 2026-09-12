import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";

test("listJobs returns a defensive array copy", async () => {
  const job = await createJob({ title: "Build a dashboard" });
  const listedJobs = await listJobs();

  listedJobs.length = 0;

  const nextListedJobs = await listJobs();

  assert.equal(nextListedJobs.length, 1);
  assert.equal(nextListedJobs[0], job);
});
