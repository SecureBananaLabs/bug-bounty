import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
}).refine(
  (data) => {
    if (data.budgetMin === undefined || data.budgetMax === undefined) return true;
    return data.budgetMax >= data.budgetMin;
  },
  { message: "budgetMax must be greater than or equal to budgetMin", path: ["budgetMax"] }
);

export const partialJobSchema = createJobSchema.partial().refine(
  (data) => {
    if (data.budgetMin === undefined || data.budgetMax === undefined) return true;
    return data.budgetMax >= data.budgetMin;
  },
  { message: "budgetMax must be greater than or equal to budgetMin", path: ["budgetMax"] }
);

export type CreateJobInput = z.input<typeof createJobSchema>;
export type PartialJobInput = z.input<typeof partialJobSchema>;
