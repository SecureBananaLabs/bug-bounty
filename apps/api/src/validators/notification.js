const { z } = require('zod');

const createNotificationSchema = z.object({
  userId: z.string().min(1, 'userId must be a non-empty string'),
  type: z.string().min(1, 'type must be a non-empty string'),
  message: z.string().min(1, 'message must be a non-empty string'),
});

module.exports = { createNotificationSchema };
