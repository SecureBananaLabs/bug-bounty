const jobService = require('../services/jobService');
const { createJobSchema, updateJobSchema } = require('../validators/jobValidator');

const createJob = async (req, res, next) => {
  try {
    const validation = createJobSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues });
    }
    const job = await jobService.createJob(validation.data);
    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
};

const updateJob = async (req, res, next) => {
  try {
    const validation = updateJobSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues });
    }
    const job = await jobService.updateJob(req.params.id, validation.data);
    res.json(job);
  } catch (err) {
    next(err);
  }
};

const getJob = async (req, res, next) => {
  try {
    const job = await jobService.getJob(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (err) {
    next(err);
  }
};

const listJobs = async (req, res, next) => {
  try {
    const jobs = await jobService.listJobs(req.query);
    res.json(jobs);
  } catch (err) {
    next(err);
  }
};

const deleteJob = async (req, res, next) => {
  try {
    await jobService.deleteJob(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { createJob, updateJob, getJob, listJobs, deleteJob };
