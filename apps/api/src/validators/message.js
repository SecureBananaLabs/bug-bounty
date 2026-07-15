import { z } from "zod";

export const createMessageSchema = z.object({
  fromUserId: z.string().trim().min(1),
  toUserId: z.string().trim().min(1),
  body: z.string().trim().min(1)
}).passthrough();
