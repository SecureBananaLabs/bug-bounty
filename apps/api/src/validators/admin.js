import { z } from "zod";

export const adminListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  q: z.string().trim().optional().default(""),
  role: z.string().trim().optional().default("all"),
  status: z.string().trim().optional().default("all")
});

export const adminActionSchema = z.object({
  action: z.enum(["activate", "suspend", "verify", "feature", "hide", "close", "reopen", "approve"]),
  reason: z.string().trim().min(3).max(240)
});

export const disputeResolutionSchema = z.object({
  resolution: z.enum(["refund_client", "release_freelancer", "split_payment", "needs_more_evidence"]),
  note: z.string().trim().min(3).max(300)
});

export const platformControlSchema = z.object({
  enabled: z.boolean(),
  reason: z.string().trim().min(3).max(240)
});
