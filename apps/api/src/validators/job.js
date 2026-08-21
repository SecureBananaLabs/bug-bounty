import { z } from "zod";

function addUniqueSkillsIssue(payload, ctx) {
  if (!payload.skills) {
    return;
  }

  const seenSkills = new Set();

  payload.skills.forEach((skill, index) => {
    const normalizedSkill = skill.toLowerCase();

    if (seenSkills.has(normalizedSkill)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Skills must be unique",
        path: ["skills", index]
      });
      return;
    }

    seenSkills.add(normalizedSkill);
  });
}

const jobSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(10),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  categoryId: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

export const createJobSchema = jobSchema.superRefine(addUniqueSkillsIssue);

export const updateJobSchema = jobSchema.partial().superRefine(addUniqueSkillsIssue);
