import { z } from "zod";

export const messageSchema = z.object({
  content: z.string()
    .min(1, { message: "Message content cannot be empty" })
    .max(10000, { message: "Message content is too long (max 10,000 characters)" })
    .trim(),
  recipientId: z.string()
    .min(1, { message: "Recipient ID is required" })
    .trim(),
});

export function validateMessage(data) {
  return messageSchema.safeParse(data);
}
