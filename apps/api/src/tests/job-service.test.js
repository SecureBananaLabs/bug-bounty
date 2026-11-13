import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";

test("listJobs returns a defensive snapshot", async () => {
  const created = await createJob({ title: "Defensive copy check" });
  const listed = await listJobs();

  listed.push({ id: "job_injected", title: "Injected" });

  const listedAgain = await listJobs();

  assert.ok(listedAgain.some((job) => job.id === created.id));
  assert.equal(listedAgain.some((job) => job.id === "job_injected"), false);
});
