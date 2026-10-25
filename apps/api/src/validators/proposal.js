import { z } from "zod";

export const createProposalSchema = z.object({
  estimatedDuration: z.number().finite().positive()
});

export function validateCreateProposal(payload) {
  const parsed = createProposalSchema.safeParse(payload ?? {});

  if (!parsed.success) {
    const [issue] = parsed.error.issues;
    const path =
      issue && Array.isArray(issue.path) && issue.path.length > 0
        ? issue.path.join(".")
        : "estimatedDuration";
    return { valid: false, message: `${path} must be a positive number` };
  }

  return {
    valid: true,
    data: { ...payload, estimatedDuration: parsed.data.estimatedDuration }
  };
}
