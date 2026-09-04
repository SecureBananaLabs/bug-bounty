import { z } from "zod";

const requiredString = z.string().trim().min(1);

export const createNotificationSchema = z.object({
  userId: requiredString,
  title: requiredString,
  body: requiredString
});
