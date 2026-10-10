const Joi = require('joi');

const budgetSchema = Joi.object({
  budgetMin: Joi.number().integer().positive().optional(),
  budgetMax: Joi.number().integer().positive().optional(),
}).min(1);

function validateBudget(payload) {
  const { error, value } = budgetSchema.validate(payload, { abortEarly: false });
  if (error) {
    throw new Error(`Invalid budget: ${error.message}`);
  }

  // Only validate inversion when both bounds are provided (full range)
  if (value.budgetMin !== undefined && value.budgetMax !== undefined) {
    if (value.budgetMax < value.budgetMin) {
      throw new Error('budgetMax must be greater than or equal to budgetMin');
    }
  }

  return value;
}

module.exports = { validateBudget };
