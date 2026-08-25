const { listJobs, getJobById, createJob, updateJob, deleteJob } = require('../services/jobService');
const { success, error } = require('../utils/response');

async function getJobs(req, res, next) {
  try {
    const { status, categoryId, minBudget } = req.query;
    const jobs = await listJobs({ status, categoryId, minBudget });
    return success(res, jobs);
  } catch (err) {
    next(err);
  }
}

async function getJob(req, res, next) {
  try {
    const job = await getJobById(req.params.id);
    if (!job) return error(res, 'Job not found', 404);
    return success(res, job);
  } catch (err) {
    next(err);
  }
}

async function postJob(req, res, next) {
  try {
    const job = await createJob({ ...req.body, clientId: req.user.id });
    return success(res, job, 201);
  } catch (err) {
    next(err);
  }
}

async function patchJob(req, res, next) {
  try {
    const job = await updateJob(req.params.id, req.body);
    return success(res, job);
  } catch (err) {
    next(err);
  }
}

async function removeJob(req, res, next) {
  try {
    await deleteJob(req.params.id);
    return success(res, { message: 'Job deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getJobs,
  getJob,
  postJob,
  patchJob,
  removeJob,
};