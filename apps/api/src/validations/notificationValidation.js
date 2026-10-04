<content>
const { z } = require('zod');

/**
 * Schema for creating a notification payload.
 * It defines the allowed fields and their types, ensuring that
 * dangerous fields like 'id' and 'read' are rejected.
 */
const createNotificationPayloadSchema = z.object({
  // Define allowed fields here. For example:
  title: z.string().min(1, 'Title is required').max(100),
  content: z.string().min(1, 'Content is required'),
  userId: z.string().uuid('Invalid user ID format'), // Example field
  // Add other allowed fields as necessary
}).strict(); // .strict() prevents unknown fields from being passed

module.exports = {
  createNotificationPayloadSchema,
};
</content>