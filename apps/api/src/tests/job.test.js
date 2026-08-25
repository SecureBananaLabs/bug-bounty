import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "../services/jobService.js";

test("Unit Test: job service returns defensive snapshots", async () => {
  // 1. Create a job
  const jobPayload = {
    title: "Software Engineer",
    description: "Write clean and elegant JS code",
    budgetMin: 50,
    budgetMax: 100,
    categoryId: "tech",
    skills: ["javascript", "nodejs"]
  };
  
  const createdJob = await createJob(jobPayload);
  
  // 2. Modify properties on the returned createdJob object
  createdJob.status = "corrupted";
  createdJob.skills.push("malicious");
  
  // 3. Retrieve jobs listing
  const jobsList1 = await listJobs();
  
  assert.equal(jobsList1.length, 1);
  assert.equal(jobsList1[0].status, "open");
  assert.deepEqual(jobsList1[0].skills, ["javascript", "nodejs"]);
  
  // 4. Modify the returned jobs list array and nested object
  jobsList1.push({ id: "injected_job", status: "open" });
  jobsList1[0].status = "hacked";
  jobsList1[0].skills[0] = "corrupted";
  
  // 5. Retrieve jobs listing again and verify internal state remains intact
  const jobsList2 = await listJobs();
  
  assert.equal(jobsList2.length, 1);
  assert.equal(jobsList2[0].status, "open");
  assert.deepEqual(jobsList2[0].skills, ["javascript", "nodejs"]);
});
