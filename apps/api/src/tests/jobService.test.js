import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";

test("createJob generates unique server-controlled job IDs and default status", async () => {
  const j1 = await createJob({ id: "override_attempt_1", title: "Full Stack Engineer", budget: 5000 });
  assert.notEqual(j1.id, "override_attempt_1");
  assert.ok(j1.id.startsWith("job_"));
  assert.equal(j1.title, "Full Stack Engineer");
  assert.equal(j1.budget, 5000);
  assert.equal(j1.status, "open");

  const j2 = await createJob({ title: "Smart Contract Auditor", budget: 8000 });
  assert.notEqual(j1.id, j2.id);
  assert.ok(j2.id.startsWith("job_"));
});

test("createJob creates distinct IDs even under simultaneous creation", async () => {
  const creations = await Promise.all(
    Array.from({ length: 20 }, (_, i) => createJob({ title: `Job ${i}`, index: i }))
  );
  const ids = creations.map((j) => j.id);
  const uniqueIds = new Set(ids);
  assert.equal(uniqueIds.size, ids.length);
});
