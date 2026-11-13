const { z } = require('zod');

const postMessageSchema = z.object({
  to: z.string().min(1, 'Field "to" is required and must be a non-empty string'),
  text: z.string().min(1, 'Field "text" is required and must be a non-empty string'),
});

module.exports = { postMessageSchema };
