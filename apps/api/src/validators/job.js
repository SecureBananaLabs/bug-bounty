export function validateCreateJob(payload) {
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "Invalid payload" };
  }
  const { title, description, budgetMin, budgetMax, categoryId, skills = [] } = payload;
  if (!title || typeof title !== "string" || title.trim().length < 4) {
    return { ok: false, error: "Title must be at least 4 characters" };
  }
  if (!description || typeof description !== "string" || description.trim().length < 10) {
    return { ok: false, error: "Description must be at least 10 characters" };
  }
  if (typeof budgetMin !== "number" || isNaN(budgetMin) || budgetMin < 0) {
    return { ok: false, error: "budgetMin must be a non-negative number" };
  }
  if (typeof budgetMax !== "number" || isNaN(budgetMax) || budgetMax < 0) {
    return { ok: false, error: "budgetMax must be a non-negative number" };
  }
  if (budgetMax < budgetMin) {
    return { ok: false, error: "budgetMax must be greater than or equal to budgetMin" };
  }
  if (!categoryId || typeof categoryId !== "string" || categoryId.trim().length < 1) {
    return { ok: false, error: "categoryId is required" };
  }
  return {
    ok: true,
    data: {
      title: title.trim(),
      description: description.trim(),
      budgetMin,
      budgetMax,
      categoryId: categoryId.trim(),
      skills: Array.isArray(skills) ? skills : []
    }
  };
}

export function validateUpdateJob(payload) {
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "Invalid payload" };
  }
  const { budgetMin, budgetMax } = payload;
  if (budgetMin !== undefined && (typeof budgetMin !== "number" || isNaN(budgetMin) || budgetMin < 0)) {
    return { ok: false, error: "budgetMin must be a non-negative number" };
  }
  if (budgetMax !== undefined && (typeof budgetMax !== "number" || isNaN(budgetMax) || budgetMax < 0)) {
    return { ok: false, error: "budgetMax must be a non-negative number" };
  }
  if (budgetMin !== undefined && budgetMax !== undefined && budgetMax < budgetMin) {
    return { ok: false, error: "budgetMax must be greater than or equal to budgetMin" };
  }
  return { ok: true, data: payload };
}
