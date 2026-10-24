import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";

test("listJobs returns defensive snapshots", async () => {
  await createJob({
    title: "Snapshot job",
    description: "A job used to verify defensive list snapshots",
    budgetMin: 100,
    budgetMax: 300,
    categoryId: "qa",
    skills: ["Testing"]
  });

  const firstList = await listJobs();
  firstList.push({ id: "injected", title: "Injected job" });
  firstList[0].title = "Mutated job";

  const secondList = await listJobs();

  assert.equal(secondList.some((job) => job.id === "injected"), false);
  assert.equal(secondList.some((job) => job.title === "Mutated job"), false);
  assert.equal(secondList.some((job) => job.title === "Snapshot job"), true);
});
