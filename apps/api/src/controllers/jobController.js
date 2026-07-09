const jobService = require('../services/jobService');

const jobController = {
  async listJobs(req, res, next) {
    try {
      const jobs = await jobService.listJobs(req.query);
      res.json(jobs);
    } catch (error) {
      next(error);
    }
  },

  async getJob(req, res, next) {
    try {
      const job = await jobService.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      res.json(job);
    } catch (error) {
      next(error);
    }
  },

  async createJob(req, res, next) {
    try {
      // req.user is set by authenticate middleware
      const job = await jobService.createJob(req.body, req.user.id);
      res.status(201).json(job);
    } catch (error) {
      next(error);
    }
  },

  async updateJob(req, res, next) {
    try {
      const job = await jobService.updateJob(req.params.id, req.body, req.user.id);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      res.json(job);
    } catch (error) {
      next(error);
    }
  },

  async deleteJob(req, res, next) {
    try {
      const deleted = await jobService.deleteJob(req.params.id, req.user.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Job not found' });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};

module.exports = jobController;
