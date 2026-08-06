const Joi = require('joi');

const createJobSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(10).max(5000).required(),
  budgetMin: Joi.number().positive().precision(2).required(),
  budgetMax: Joi.number().positive().precision(2).required(),
  currency: Joi.string().valid('USD', 'EUR', 'GBP', 'INR').default('USD'),
  category: Joi.string().required(),
  skills: Joi.array().items(Joi.string()).min(1).required(),
  deadline: Joi.date().iso().min('now').required(),
  status: Joi.string().valid('open', 'closed', 'draft').default('open'),
}).custom((value, helpers) => {
  if (value.budgetMax <= value.budgetMin) {
    return helpers.message('budgetMax must be greater than budgetMin');
  }
  return value;
});

const updateJobSchema = Joi.object({
  title: Joi.string().min(3).max(100),
  description: Joi.string().min(10).max(5000),
  budgetMin: Joi.number().positive().precision(2),
  budgetMax: Joi.number().positive().precision(2),
  currency: Joi.string().valid('USD', 'EUR', 'GBP', 'INR'),
  category: Joi.string(),
  skills: Joi.array().items(Joi.string()).min(1),
  deadline: Joi.date().iso().min('now'),
  status: Joi.string().valid('open', 'closed', 'draft'),
}).custom((value, helpers) => {
  if (value.budgetMax !== undefined && value.budgetMin !== undefined && value.budgetMax <= value.budgetMin) {
    return helpers.message('budgetMax must be greater than budgetMin');
  }
  return value;
});

module.exports = { createJobSchema, updateJobSchema };
