<content>
const { z } = require('zod');

/**
 * Schema for creating a message payload.
 * It defines the allowed fields and their types, ensuring that
 * dangerous fields like 'id' are rejected.
 */
const createMessagePayloadSchema = z.object({
  // Define allowed fields here. For example:
  text: z.string().min(1, 'Message text is required'),
  recipientId: z.string().uuid('Invalid recipient ID format'), // Example field
  // Add other allowed fields as necessary
}).strict(); // .strict() prevents unknown fields from bein passed

module.exports = {
  createMessagePayloadSchema,
};
</content>