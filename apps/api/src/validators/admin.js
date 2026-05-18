import { z } from "zod";

export const updateUserStatusSchema = z.object({
  status: z.enum(["active", "suspended", "banned"])
});

export const moderateJobSchema = z.object({
  action: z.enum(["approve", "reject", "escalate"]),
  reason: z.string().optional()
});

export const ruleDisputeSchema = z.object({
  ruling: z.enum(["favor_raiser", "favor_opponent", "refund_both", "escalate"]),
  notes: z.string().optional()
});

export const updateControlsSchema = z.object({
  registrationsOpen: z.boolean().optional(),
  jobPostingsOpen: z.boolean().optional()
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const auditLogFilterSchema = z.object({
  adminId: z.string().optional(),
  action: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});
