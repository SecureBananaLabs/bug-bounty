const { validateBudgetRange } = require('../utils/budget');

/**
 * Middleware: validates a create-job payload.
 * Rejects when budgetMax < budgetMin (both bounds present).
 */
function createJobValidator(req, res, next) {
  const { budgetMin, budgetMax } = req.body;

  const result = validateBudgetRange(budgetMin, budgetMax);
  if (!result.valid) {
    return res.status(400).json({
      success: false,
      error: result.error,
    });
  }

  next();
}

/**
 * Middleware: validates an update-job payload.
 * Rejects when both bounds are supplied and inverted.
 * Preserves partial updates that provide only one bound.
 */
function updateJobValidator(req, res, next) {
  const { budgetMin, budgetMax } = req.body;

  // Only validate when both bounds are present in the update payload
  if (budgetMin !== undefined || budgetMax !== undefined) {
    const result = validateBudgetRange(budgetMin, budgetMax);
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  }

  next();
}

module.exports = { createJobValidator, updateJobValidator };
