/**
 * Validates that a budget range is logically consistent.
 * When both budgetMin and budgetMax are provided, budgetMax must not be less than budgetMin.
 *
 * @param {number|undefined} budgetMin - The minimum budget value
 * @param {number|undefined} budgetMax - The maximum budget value
 * @returns {{ valid: boolean, error?: string }}
 */
function validateBudgetRange(budgetMin, budgetMax) {
  // If only one bound is supplied, it's always valid (partial update)
  if (budgetMin === undefined && budgetMax === undefined) {
    return { valid: true };
  }
  if (budgetMin === undefined || budgetMax === undefined) {
    return { valid: true };
  }

  // Both bounds supplied — reject if inverted
  if (budgetMax < budgetMin) {
    return {
      valid: false,
      error: 'budgetMax must not be less than budgetMin',
    };
  }

  return { valid: true };
}

module.exports = { validateBudgetRange };
