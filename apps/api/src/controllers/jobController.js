const jobService = require('../services/jobService');

async function createJob(req, res, next) {
  try {
    // req.body is already validated and parsed by middleware
    const job = await jobService.createJob(req.body);
    res.status(201).json({ message: 'Job created successfully', job });
  } catch (err) {
    next(err);
  }
}

async function getJobs(req, res, next) {
  try {
    const jobs = await jobService.getJobs();
    res.json(jobs);
  } catch (err) {
    next(err);
  }
}

async function getJobById(req, res, next) {
  try {
    const job = await jobService.getJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (err) {
    next(err);
  }
}

async function updateJob(req, res, next) {
  try {
    const job = await jobService.updateJob(req.params.id, req.body);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json({ message: 'Job updated successfully', job });
  } catch (err) {
    next(err);
  }
}

async function deleteJob(req, res, next) {
  try {
    const job = await jobService.deleteJob(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { createJob, getJobs, getJobById, updateJob, deleteJob };
