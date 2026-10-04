<content>
import { z } from 'zod';

export const createNotificationSchema = z.object({
  userId: z.string(),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  type: z.enum(['info', 'warning', 'error', 'success']),
  isRead: z.boolean().default(false),
});

export const updateNotificationSchema = createNotificationSchema.partial().extend({
  id: z.string(),
});

export const createNotificationSchemaType = z.infer<typeof createNotificationSchema>;
export const updateNotificationSchemaType = z.infer<typeof updateNotificationSchema>;