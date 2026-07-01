import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

test("createJob keeps id and initial status server-owned while preserving job payload", async () => {
  const job = await createJob({
    id: "job_client_supplied",
    status: "closed",
    title: "Build landing page",
    description: "Marketing site",
    budgetMin: 100,
    budgetMax: 200
  });

  assert.notEqual(job.id, "job_client_supplied");
  assert.match(job.id, /^job_\d+$/);
  assert.equal(job.status, "open");
  assert.equal(job.title, "Build landing page");
  assert.equal(job.description, "Marketing site");
  assert.equal(job.budgetMin, 100);
  assert.equal(job.budgetMax, 200);
});

test("createJob stores a generated open job even when the payload tries to override controlled fields", async () => {
  const job = await createJob({
    id: "job_spoofed_storage_key",
    status: "archived",
    title: "API hardening",
    budgetMin: 300,
    budgetMax: 500
  });

  assert.notEqual(job.id, "job_spoofed_storage_key");
  assert.match(job.id, /^job_\d+$/);
  assert.equal(job.status, "open");
});
