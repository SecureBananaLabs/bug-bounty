import { z } from "zod";

export const createNotificationSchema = z.object({
  userId: z.string().trim().min(1),
  title: z.string().trim().min(2),
  body: z.string().trim().min(2)
});

// Returns { valid, data } or { valid, message } so the controller can answer a
// 400 without depending on the error handler to understand zod shapes.
export function validateCreateNotification(payload) {
  const result = createNotificationSchema.safeParse(payload);

  if (!result.success) {
    const first = result.error.issues[0];

    return {
      valid: false,
      message: `${first.path.join(".") ?? "payload"} is required`
    };
  }

  return { valid: true, data: result.data };
}
