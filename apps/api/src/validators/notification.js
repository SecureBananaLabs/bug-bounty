import { z } from "zod";

// `message` is the only required input for creating a notification. Trim the
// input so whitespace-only values are caught by `min(1)`.
export const createNotificationSchema = z.object({
  message: z.string().trim().min(1)
});
