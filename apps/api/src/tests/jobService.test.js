import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";

test("job service returns defensive snapshots", async () => {
  const skills = ["javascript"];
  const created = await createJob({
    title: "Snapshot job",
    description: "A job long enough for service regression coverage",
    budgetMin: 10,
    budgetMax: 20,
    categoryId: "cat_frontend",
    skills
  });

  skills.push("payload-mutation");
  created.status = "mutated-created";
  created.skills.push("created-mutation");

  const firstList = await listJobs();
  const firstLength = firstList.length;
  const firstSnapshot = firstList.find((job) => job.id === created.id);

  assert.ok(firstSnapshot);
  firstSnapshot.status = "mutated-list";
  firstSnapshot.skills.push("list-mutation");
  firstList.push({ id: "injected", status: "open" });

  const secondList = await listJobs();
  const storedJob = secondList.find((job) => job.id === created.id);

  assert.equal(secondList.length, firstLength);
  assert.equal(storedJob.status, "open");
  assert.deepEqual(storedJob.skills, ["javascript"]);
});
