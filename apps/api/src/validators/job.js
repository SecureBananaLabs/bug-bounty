import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  budget: z.number().positive().optional(),
});

export const updateJobStatusSchema = z.object({
  status: z.enum(["DRAFT", "OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
});
