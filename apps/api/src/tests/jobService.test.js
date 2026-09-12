import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";

test("createJob creates a job with server-owned id and default open status", async () => {
  const payload = {
    title: "Senior Node.js Developer",
    description: "Build high-throughput microservices and APIs.",
    budgetMin: 5000,
    budgetMax: 8000,
    categoryId: "cat_backend",
    skills: ["Node.js", "Express", "PostgreSQL"],
  };

  const job = await createJob(payload);

  assert.ok(job.id.startsWith("job_"), "Job ID should start with 'job_'");
  assert.equal(job.status, "open", "Job status should default to 'open'");
  assert.equal(job.title, payload.title);
  assert.equal(job.description, payload.description);
  assert.equal(job.budgetMin, payload.budgetMin);
  assert.equal(job.budgetMax, payload.budgetMax);
  assert.equal(job.categoryId, payload.categoryId);
  assert.deepEqual(job.skills, payload.skills);
});

test("createJob does not allow caller-provided id to override server id", async () => {
  const maliciousPayload = {
    id: "custom_injected_id_999",
    title: "Security Auditor",
    description: "Perform audit on platform smart contracts.",
    budgetMin: 3000,
    budgetMax: 6000,
    categoryId: "cat_security",
    skills: ["Security"],
  };

  const job = await createJob(maliciousPayload);

  assert.notEqual(job.id, "custom_injected_id_999", "Injected ID must be overwritten by server");
  assert.ok(job.id.startsWith("job_"), "Server must assign a valid 'job_' ID");
  assert.equal(job.status, "open");
});

test("createJob does not allow caller-provided status to override default open status", async () => {
  const spoofedStatusPayload = {
    status: "closed",
    title: "Frontend React Engineer",
    description: "Implement responsive UI components in Next.js.",
    budgetMin: 4000,
    budgetMax: 7000,
    categoryId: "cat_frontend",
    skills: ["React", "TypeScript"],
  };

  const job = await createJob(spoofedStatusPayload);

  assert.equal(job.status, "open", "Initial status must strictly be 'open'");
});

test("listJobs returns all accumulated created jobs", async () => {
  const allJobs = await listJobs();
  assert.ok(Array.isArray(allJobs), "listJobs should return an array");
  assert.ok(allJobs.length >= 3, "listJobs should contain created jobs");
});
