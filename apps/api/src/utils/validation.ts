/**
 * Validates that a budget range is valid (budgetMax >= budgetMin).
 * Returns true if the range is valid or if either value is not provided.
 * 
 * @param budgetMin - The minimum budget value
 * @param budgetMax - The maximum budget value
 * @returns true if the range is valid, false otherwise
 */
export function validateBudgetRange(budgetMin: number | null | undefined, budgetMax: number | null | undefined): boolean {
  if (budgetMin === undefined || budgetMin === null) return true;
  if (budgetMax === undefined || budgetMax === null) return true;
  
  return budgetMax >= budgetMin;
}