import { z } from "zod";

export const createNotificationSchema = z.object({userId: z.string().min(1), type: z.string().min(1), message: z.string().min(1)});
