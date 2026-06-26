const jobs = [];

function snapshotJob(job) {
  const snapshot = { ...job };
  if (Array.isArray(snapshot.skills)) {
    snapshot.skills = [...snapshot.skills];
  }
  return snapshot;
}

export async function listJobs() {
  return jobs.map(snapshotJob);
}

export async function createJob(payload) {
  const job = {
    id: `job_${Date.now()}`,
    status: "open",
    ...payload
  };
  if (Array.isArray(job.skills)) {
    job.skills = [...job.skills];
  }
  jobs.push(job);
  return snapshotJob(job);
}
