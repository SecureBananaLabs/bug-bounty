const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1).nonempty(), // Required fullName validation
  role: z.string()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

module.exports = { registerSchema };