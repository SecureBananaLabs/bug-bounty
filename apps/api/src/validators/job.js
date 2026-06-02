import { z } from "zod";

const budgetRangeRefinement = (data) => (
  data.budgetMin === undefined ||
  data.budgetMax === undefined ||
  data.budgetMax >= data.budgetMin
);

const budgetRangeMessage = {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"]
};

const baseJobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

export const createJobSchema = baseJobSchema.refine(
  budgetRangeRefinement,
  budgetRangeMessage
);

export const updateJobSchema = baseJobSchema.partial().refine(
  budgetRangeRefinement,
  budgetRangeMessage
);
