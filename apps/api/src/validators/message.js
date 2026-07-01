import { z } from "zod";

export const createMessageSchema = z.object({
  text: z.string().trim().min(1, "Message text is required").max(4000, "Message text is too long"),
})
.strict();
