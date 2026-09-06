const Joi = require('joi');

const MAX_SKILLS = 20;

const skillSchema = Joi.string().trim().min(1).max(100);

const createJobSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().min(1).max(5000).required(),
  budget: Joi.number().positive().required(),
  skills: Joi.array().items(skillSchema).max(MAX_SKILLS).default([]),
  category: Joi.string().trim().min(1).max(100).required(),
  status: Joi.string().valid('open', 'closed', 'in_progress').default('open'),
});

const updateJobSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200),
  description: Joi.string().trim().min(1).max(5000),
  budget: Joi.number().positive(),
  skills: Joi.array().items(skillSchema).max(MAX_SKILLS),
  category: Joi.string().trim().min(1).max(100),
  status: Joi.string().valid('open', 'closed', 'in_progress'),
}).min(1);

module.exports = { createJobSchema, updateJobSchema, MAX_SKILLS };
