const jobs = [];

const Issue = require('../models/Issue');
export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const job = { id: `job_${Date.now()}`, status: "open", ...payload };
  jobs.push(job);
  return job;
}
    return jobs;
  }

  async detectLowHangingFruit() {
    const jobs = await Job.find({ status: 'open', complexity: 'low' });
    const issues = [];

    for (const job of jobs) {
      const existingIssue = await Issue.findOne({ jobId: job._id, type: 'low-hanging-fruit' });
      if (!existingIssue) {
        const issue = await Issue.create({
          jobId: job._id,
          type: 'low-hanging-fruit',
          title: `Low Hanging Fruit: ${job.title}`,
          description: `Automated detection for job ${job._id}.\n\nThis issue is limited only to the creator of this issue. This means that only the issue author can attempt to solve this issue. If you would like to work on it, please create another issue with the same contents and refer to issue #743 for more information.`,
          status: 'open'
        });
        issues.push(issue);
      }
    }

    return issues;
  }

  async updateJobStatus(jobId, status) {
    const job = await Job.findByIdAndUpdate(
      jobId,
