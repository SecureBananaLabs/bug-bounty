const budgets = [];

export async function listBudgets() {
  return budgets;
}

export async function createBudget(payload) {
  const { projectId, amount, description } = payload;
  if (!projectId || !amount || amount <= 0) {
    throw new Error("Invalid budget: projectId and positive amount required");
  }
  const budget = {
    id: `bud_${Date.now()}`,
    projectId,
    amount,
    description: description || "",
    createdAt: new Date().toISOString()
  };
  budgets.push(budget);
  return budget;
}
