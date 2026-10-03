<content>
const { v4: uuidv4 } = require('uuid');

// In-memory storage for jobs (in a real app, this would be a database)
let jobs = [];

const createJob = (payload) => {
  // Generate default values
  const newJob = {
    id: uuidv4(),
    status: "open",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Create a copy of the payload without the protected fields
  const sanitizedPayload = { ...payload };
  delete sanitizedPayload.id;
  delete sanitizedPayload.status;

  // Combine the default values with the sanitized payload
  const finalJob = { ...newJob, ...sanitizedPayload };

  jobs.push(finalJob);
  return finalJob;
};

const getJobs = () => {
  return jobs;
};

const getJobById = (id) => {
  return jobs.find(job => job.id === id);
};

const updateJob = (id, payload) => {
  const jobIndex = jobs.findIndex(job => job.id === id);
  if (jobIndex === -1) {
    return null;
  }

  // Update the job with the new payload
  const updatedJob = {
    ...jobs[jobIndex],
    ...payload,
    updatedAt: new Date().toISOString()
  };

  jobs[jobIndex] = updatedJob;
  return updatedJob;
};

const deleteJob = (id) => {
  const jobIndex = jobs.findIndex(job => job.id === id);
  if (jobIndex === -1) {
    return false;
  }

  jobs.splice(jobIndex, 1);
  return true;
};

module.exports = {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob
};
</content>