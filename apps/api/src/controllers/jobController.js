const jobService = require('../services/jobService');
const { createJobSchema, updateJobSchema } = require('../validators/jobValidator');

const createJob = async (req, res, next) => {
  try {
    const { error, value } = createJobSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const job = await jobService.createJob(value, req.user.id);
    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
};

const getJobs = async (req, res, next) => {
  try {
    const jobs = await jobService.getJobs(req.query);
    res.json(jobs);
  } catch (err) {
    next(err);
  }
};

const getJobById = async (req, res, next) => {
  try {
    const job = await jobService.getJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (err) {
    next(err);
  }
};

const updateJob = async (req, res, next) => {
  try {
    const { error, value } = updateJobSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const job = await jobService.updateJob(req.params.id, value, req.user.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (err) {
    next(err);
  }
};

const deleteJob = async (req, res, next) => {
  try {
    const job = await jobService.deleteJob(req.params.id, req.user.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createJob, getJobs, getJobById, updateJob, deleteJob };
