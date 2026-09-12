import { z } from "zod";

export const createNotificationSchema = z.object({
  title: z.string().min(1, "Notification title is required").max(200, "Title must be 200 characters or less"),
  body: z.string().max(5000, "Body must be 5000 characters or less").optional()
});
