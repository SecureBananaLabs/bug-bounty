import { z } from "zod";

const trimmedString = (minLength) => z.string().trim().min(minLength);

export const createJobSchema = z.object({
  title: trimmedString(4),
  description: trimmedString(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: trimmedString(1),
  skills: z.array(trimmedString(1)).default([])
});

export const updateJobSchema = createJobSchema.partial();
