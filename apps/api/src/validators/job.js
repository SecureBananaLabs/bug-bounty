import { z } from "zod";

const MAX_JOB_TITLE_LENGTH = 120;
const MAX_JOB_DESCRIPTION_LENGTH = 2000;
const MAX_JOB_CATEGORY_ID_LENGTH = 80;
const MAX_JOB_SKILLS = 20;
const MAX_JOB_SKILL_LENGTH = 60;

export const createJobSchema = z.object({
  title: z.string().min(4).max(MAX_JOB_TITLE_LENGTH),
  description: z.string().min(10).max(MAX_JOB_DESCRIPTION_LENGTH),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1).max(MAX_JOB_CATEGORY_ID_LENGTH),
  skills: z.array(z.string().min(1).max(MAX_JOB_SKILL_LENGTH)).max(MAX_JOB_SKILLS).default([])
});

export const updateJobSchema = createJobSchema.partial();
