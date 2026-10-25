import { z } from "zod";

export const createMessageSchema = z.object({
  senderId: z.string().trim().min(1),
  recipientId: z.string().trim().min(1),
  content: z.string().trim().min(1)
});

// A message without a sender, a recipient or text is not deliverable, so the
// handler rejects the whole payload instead of storing a partial record.
export function validateCreateMessage(payload) {
  const result = createMessageSchema.safeParse(payload);

  if (!result.success) {
    const first = result.error.issues[0];

    return {
      valid: false,
      message: `${first.path.join(".") ?? "payload"} must be a non-empty string`
    };
  }

  return { valid: true, data: result.data };
}
