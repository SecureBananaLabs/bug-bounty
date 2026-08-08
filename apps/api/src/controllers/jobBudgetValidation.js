export function validateJobBudgetRange(budgetMin, budgetMax) {
  if (budgetMin !== undefined && budgetMax !== undefined && Number(budgetMax) < Number(budgetMin)) {
    return {
      valid: false,
      message: "budgetMax cannot be less than budgetMin"
    };
  }
  return { valid: true };
}
