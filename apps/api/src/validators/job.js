import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().min(4).max(200),
  description: z.string().min(10).max(5000),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  clientId: z.string().min(1),
}).refine((data) => data.budgetMax >= data.budgetMin, {
  message: "budgetMax must be greater than or equal to budgetMin",
  path: ["budgetMax"],
});
