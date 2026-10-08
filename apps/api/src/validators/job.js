import { z } from "zod";

const jobFields = {
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
};

// budgetMin and budgetMax used to be validated independently, so an inverted
// range such as { budgetMin: 500, budgetMax: 100 } was accepted and every
// budget filter downstream then matched nothing.
const orderedBudget = (schema) =>
  schema.refine(
    (job) =>
      job.budgetMin === undefined ||
      job.budgetMax === undefined ||
      job.budgetMax >= job.budgetMin,
    { message: "budgetMax must be greater than or equal to budgetMin" }
  );

export const createJobSchema = orderedBudget(z.object(jobFields));

export const updateJobSchema = orderedBudget(z.object(jobFields).partial());
