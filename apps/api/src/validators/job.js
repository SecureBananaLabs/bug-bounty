import { z } from "zod";

export const JOB_STATUSES = [
  "DRAFT",
  "OPEN",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED"
];

export const createJobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

export const updateJobSchema = createJobSchema.partial();

export const updateJobStatusSchema = z.object({
  status: z.enum(["DRAFT", "OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
});
