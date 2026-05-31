import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";

test("job service keeps records and lifecycle fields server-owned", async () => {
  const initialJobs = await listJobs();
  const initialCount = initialJobs.length;

  const created = await createJob({
    id: "job_client_controlled",
    status: "closed",
    title: "Server-owned lifecycle fields",
    budgetMin: 30,
    budgetMax: 60
  });

  assert.match(created.id, /^job_\d+$/);
  assert.notEqual(created.id, "job_client_controlled");
  assert.equal(created.status, "open");

  created.title = "mutated through returned create payload";

  const listedJobs = await listJobs();
  assert.equal(listedJobs.length, initialCount + 1);
  assert.equal(listedJobs.at(-1).title, "Server-owned lifecycle fields");

  listedJobs.push({
    id: "job_client_injected",
    status: "open",
    title: "injected through list result"
  });
  listedJobs.at(-2).title = "mutated through list result";

  const reloadedJobs = await listJobs();
  assert.equal(reloadedJobs.length, initialCount + 1);
  assert.equal(reloadedJobs.at(-1).id, created.id);
  assert.equal(reloadedJobs.at(-1).title, "Server-owned lifecycle fields");
  assert.equal(
    reloadedJobs.some((job) => job.id === "job_client_injected"),
    false
  );
});
