const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email().nonempty(),
  password: z.string().min(8).nonempty(),
  fullName: z.string().min(1).nonempty(),
  role: z.string().nonempty()
});

module.exports = { registerSchema };