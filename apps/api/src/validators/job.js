import { z } from "zod";

const jobFields = {
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
};

// Each bound is checked on its own, so an inverted pair such as
// { budgetMin: 500, budgetMax: 100 } used to pass and made every budget
// filter downstream return an empty result set.
function orderedBudget(job) {
  if (job.budgetMin === undefined || job.budgetMax === undefined) {
    return true;
  }
  return job.budgetMax >= job.budgetMin;
}

const budgetOrder = { message: "budgetMax must be greater than or equal to budgetMin" };

export const createJobSchema = z.object(jobFields).refine(orderedBudget, budgetOrder);

export const updateJobSchema = z.object(jobFields).partial().refine(orderedBudget, budgetOrder);
