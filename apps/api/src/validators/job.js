import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  budgetMin: z.number().positive(),
  budgetMax: z.number().positive()
}).refine(
  (data) => data.budgetMin <= data.budgetMax,
  { message: "budgetMin must be less than or equal to budgetMax", path: ["budgetMin"] }
);
