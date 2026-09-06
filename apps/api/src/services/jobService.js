const Job = require('../models/Job');

const createJob = async (jobData, userId) => {
  const job = new Job({ ...jobData, client: userId });
  return await job.save();
};

const getJobs = async (query) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;
  if (query.skills) filter.skills = { $in: query.skills.split(',') };
  return await Job.find(filter).populate('client', 'name email');
};

const getJobById = async (id) => {
  return await Job.findById(id).populate('client', 'name email');
};

const updateJob = async (id, updateData, userId) => {
  return await Job.findOneAndUpdate(
    { _id: id, client: userId },
    updateData,
    { new: true }
  );
};

const deleteJob = async (id, userId) => {
  return await Job.findOneAndDelete({ _id: id, client: userId });
};

module.exports = { createJob, getJobs, getJobById, updateJob, deleteJob };
