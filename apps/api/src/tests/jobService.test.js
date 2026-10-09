import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";

test("createJob keeps the generated id and default status server-owned", async () => {
  const created = await createJob({
    id: "caller-owned",
    status: "completed",
    title: "Build a search index",
    description: "Index every listing nightly",
    budget: 400,
    skills: ["sql"]
  });

  assert.match(created.id, /^job_\d+$/);
  assert.equal(created.status, "open");
  assert.equal(created.title, "Build a search index");
  assert.equal(created.budget, 400);
  assert.deepEqual(created.skills, ["sql"]);
});

test("listJobs returns a snapshot that does not mutate the store", async () => {
  const created = await createJob({
    title: "Design a landing page",
    description: "Marketing site refresh",
    budget: 250
  });

  const first = await listJobs();
  assert.ok(first.some((job) => job.id === created.id));

  first.push({ id: "job_injected" });
  first.length = 0;

  const second = await listJobs();
  assert.ok(second.some((job) => job.id === created.id));
  assert.ok(!second.some((job) => job.id === "job_injected"));
});
