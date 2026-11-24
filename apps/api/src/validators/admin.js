import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10)
});

export const userQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().optional(),
  role: z.enum(["client", "freelancer", "admin"]).optional(),
  status: z.enum(["active", "suspended", "banned"]).optional(),
  joinedFrom: z.string().datetime().optional(),
  joinedTo: z.string().datetime().optional()
});

export const userStatusSchema = z.object({
  action: z.enum(["suspend", "reinstate", "ban"]),
  reason: z.string().trim().min(3).max(500).optional()
});

export const moderationQuerySchema = paginationQuerySchema.extend({
  status: z.enum(["flagged", "approved", "rejected", "escalated"]).optional()
});

export const moderationDecisionSchema = z.object({
  decision: z.enum(["approve", "reject", "escalate"]),
  reason: z.string().trim().min(3).max(500)
});

export const disputeQuerySchema = paginationQuerySchema.extend({
  status: z.enum(["open", "under_review", "resolved", "escalated"]).optional()
});

export const disputeRulingSchema = z.object({
  ruling: z.enum(["favor_client", "favor_freelancer", "refund", "escalate"]),
  note: z.string().trim().min(3).max(500)
});

export const platformControlSchema = z.object({
  enabled: z.boolean()
});

export const auditLogQuerySchema = paginationQuerySchema.extend({
  adminId: z.string().trim().optional(),
  actionType: z.string().trim().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional()
});
