import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});

export const userActionSchema = z.object({
  action: z.enum(["suspend", "reinstate", "ban"])
});

export const jobActionSchema = z
  .object({
    action: z.enum(["approve", "reject", "escalate"]),
    reason: z.string().min(3).optional()
  })
  .superRefine((value, ctx) => {
    if (value.action === "reject" && !value.reason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reason"],
        message: "Reason is required when rejecting a listing"
      });
    }
  });

export const disputeActionSchema = z.object({
  action: z.enum(["rule_freelancer", "rule_client", "refund", "escalate"]),
  reason: z.string().min(3).optional()
});

export const settingsSchema = z.object({
  registrationsEnabled: z.boolean().optional(),
  jobPostingsEnabled: z.boolean().optional()
});
