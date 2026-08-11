import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

test("createJob preserves server-owned id and status", async () => {
  const job = await createJob({
    id: "client_supplied_id",
    status: "closed",
    title: "Build a landing page",
    description: "Create a polished landing page for a launch.",
    budgetMin: 500,
    budgetMax: 750,
    categoryId: "web",
    skills: ["react", "copywriting"]
  });

  assert.match(job.id, /^job_\d+$/);
  assert.notEqual(job.id, "client_supplied_id");
  assert.equal(job.status, "open");
  assert.equal(job.title, "Build a landing page");
  assert.equal(job.description, "Create a polished landing page for a launch.");
  assert.equal(job.budgetMin, 500);
  assert.equal(job.budgetMax, 750);
  assert.equal(job.categoryId, "web");
  assert.deepEqual(job.skills, ["react", "copywriting"]);
});
