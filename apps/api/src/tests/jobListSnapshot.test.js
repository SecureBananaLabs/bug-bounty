import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";

test("listJobs returns a snapshot that does not expose the internal array", async () => {
  const before = await listJobs();
  const job = await createJob({
    title: "Build a reporting dashboard",
    description: "Create dashboards for weekly marketplace reporting.",
    budgetMin: 1000,
    budgetMax: 2500,
    categoryId: "analytics",
    skills: ["React"]
  });

  const listed = await listJobs();
  listed.length = 0;
  listed.push({ id: "job_attacker", title: "Injected job" });

  const afterMutation = await listJobs();

  assert.equal(afterMutation.length, before.length + 1);
  assert.ok(afterMutation.some((item) => item.id === job.id));
  assert.equal(afterMutation.some((item) => item.id === "job_attacker"), false);
});
