import { z } from "zod";

const nonblankString = z.string().refine((value) => value.trim().length > 0);

export const createNotificationSchema = z.object({
  message: nonblankString
}).passthrough();
