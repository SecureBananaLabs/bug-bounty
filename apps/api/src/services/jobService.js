const crypto = require("crypto");

/**
 * Generate a collision-resistant job ID.
 *
 * The millisecond timestamp keeps IDs roughly ordered by creation time and
 * stays parseable by any consumer that relied on the old `job_<timestamp>`
 * shape; the 48-bit random suffix guarantees uniqueness for jobs created
 * within the same millisecond (issue #10846).
 */
function generateJobId() {
  return `job_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
}

const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const job = { id: `job_${Date.now()}`, status: "open", ...payload };
  jobs.push(job);
  return job;
}
function createJob(payload) {
  const job = { id: generateJobId(), status: "open", ...payload };
module.exports = {
  generateJobId,
  createJob,
};
