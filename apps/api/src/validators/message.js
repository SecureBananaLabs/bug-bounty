import { z } from "zod";

export const createMessageSchema = z.object({
  senderId: z.string().trim().min(1),
  receiverId: z.string().trim().min(1),
  body: z.string().trim().min(1)
});
