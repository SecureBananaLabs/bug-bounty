import { z } from "zod";

const MAX_JOB_SKILLS = 20;
const jobSkillsSchema = z.array(z.string().min(1)).max(MAX_JOB_SKILLS).default([]);

export const createJobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: jobSkillsSchema
});

export const updateJobSchema = createJobSchema.partial();
