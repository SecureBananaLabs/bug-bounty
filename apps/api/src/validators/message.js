<content>
import { z } from 'zod';

export const createMessageSchema = z.object({
  senderId: z.string(),
  receiverId: z.string(),
  content: z.string().min(1).max(1000),
  isRead: z.boolean().default(false),
});

export const updateMessageSchema = createMessageSchema.partial().extend({
  id: z.string(),
});

export const createMessageSchemaType = z.infer<typeof createMessageSchema>;
export const updateMessageSchemaType = z.infer<typeof updateMessageSchema>;