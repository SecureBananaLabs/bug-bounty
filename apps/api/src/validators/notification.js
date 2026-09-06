import { z } from "zod";

const NOTIFICATION_TYPES = ["job_update", "proposal_received", "message", "review", "payment", "system"];

export const createNotificationSchema = z.object({
  type: z.enum(NOTIFICATION_TYPES),
  userId: z.string().min(1),
  message: z.string().min(1),
  jobId: z.string().min(1).optional(),
  read: z.boolean().default(false)
});
