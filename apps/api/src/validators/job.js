import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1))
    .default([])
    .refine((skills) => {
      const lowerSkills = skills.map(s => s.toLowerCase());
      return new Set(lowerSkills).size === lowerSkills.length;
    }, {
      message: "Skills must not contain duplicate values"
    })
});

export const updateJobSchema = createJobSchema.partial();
