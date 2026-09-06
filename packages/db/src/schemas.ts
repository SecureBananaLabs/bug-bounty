import { z } from "zod";
export const jobSchema = z.object({
  title: z.string(),
  budgetMin: z.number().min(0),
  budgetMax: z.number().min(0)
}).refine(data => data.budgetMax >= data.budgetMin, { message: "budgetMax must be >= budgetMin", path: ["budgetMax"] });
