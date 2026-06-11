const { validationResult } = require('express-validator');
const Job = require('../models/Job'); // Assuming a Job model exists based on context
const { createJobSchema, updateJobSchema } = require('../validators/jobValidator'); // Assuming validators exist

// If the schema is defined directly in the controller or imported differently, 
// the logic below represents the validation logic that needs to be enforced.
// Based on the issue, we need to ensure budgetMax >= budgetMin.

exports.createJob = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, budgetMin, budgetMax, currency, ...otherFields } = req.body;

  // Explicit validation for inverted budget ranges
  if (budgetMin !== undefined && budgetMax !== undefined) {
    if (budgetMax < budgetMin) {
      return res.status(400).json({
        message: 'Invalid budget range: budgetMax cannot be lower than budgetMin.',
        field: 'budgetMax',
        code: 'INVERTED_BUDGET_RANGE'
      });
    }
  }

  try {
    const job = new Job({
      title,
      description,
      budgetMin,
      budgetMax,
      currency,
      ...otherFields,
      createdBy: req.user.id
    });

    await job.save();
    res.status(201).json(job);
  } catch (error) {
    next(error);
  }
};

exports.updateJob = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { budgetMin, budgetMax } = req.body;

  // Explicit validation for inverted budget ranges during partial updates
  // Only check if both fields are being updated in the same request
  if (budgetMin !== undefined && budgetMax !== undefined) {
    if (budgetMax < budgetMin) {
      return res.status(400).json({
        message: 'Invalid budget range: budgetMax cannot be lower than budgetMin.',
        field: 'budgetMax',
        code: 'INVERTED_BUDGET_RANGE'
      });
    }
  }

  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    next(error);
  }
};

// Placeholder for other job controller methods (getJob, deleteJob, etc.)
// to ensure the file structure remains complete if it was previously larger.
exports.getJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (error) {
    next(error);
  }
};

exports.deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    next(error);
  }
};