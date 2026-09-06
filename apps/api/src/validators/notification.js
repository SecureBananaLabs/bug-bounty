import { z } from "zod";

export const createNotificationSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.enum(["info", "warning", "error"]).default("info"),
}).strict(); // Strip extra fields like client-supplied id or read
