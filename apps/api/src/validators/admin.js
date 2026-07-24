import { z } from "zod";

export const adminListQuerySchema = z.object({
  q: z.string().trim().optional(),
  role: z.enum(["client", "freelancer", "admin"]).optional(),
  status: z.enum(["active", "suspended", "banned"]).optional(),
  joinedAfter: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(25).default(10)
});

export const adminQueueQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(25).default(10)
});

export const adminStatusSchema = z.object({
  action: z.enum(["suspend", "reinstate", "ban"]),
  reason: z.string().trim().min(3).max(180).optional().default("policy review")
});

export const adminControlSchema = z.object({
  enabled: z.coerce.boolean()
});

export const adminReviewSchema = z.object({
  decision: z.enum(["approve", "reject", "escalate"]),
  reason: z.string().trim().min(3).max(180).optional().default("policy review")
});
