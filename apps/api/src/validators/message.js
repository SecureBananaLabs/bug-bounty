import { z } from "zod";

export const SYSTEM_FIELDS = new Set([
  "id", "created_by", "created_at", "updated_at",
  "user_id", "message_id", "sender_id", "sent_at",
]);

export const messageSchema = new z.ZodObject({
  recipient_id: z.string().min(1),
  content: z.string().min(1).max(5000),
  attachments: z.array(z.string()).optional(),
});

/** Remove system-controlled fields from user input. */
export function filterSystemFields(obj) {
  const filtered = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!SYSTEM_FIELDS.has(k)) filtered[k] = v;
  }
  return filtered;
}
