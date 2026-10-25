// Add validation for budget range
if (payload.budgetMin && payload.budgetMax && payload.budgetMax < payload.budgetMin) {
  throw new Error('Budget max must be greater than or equal to budget min');
}