import { z } from "zod";

export const createNotificationSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  title: z.string().min(1, "title is required"),
  body: z.string().min(1, "body is required"),
  type: z.enum(["info", "warning", "error", "success"], {
    errorMap: () => ({ message: "type must be one of: info, warning, error, success" })
  })
});
