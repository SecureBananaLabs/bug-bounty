const { z } = require('zod');

exports.registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
});

exports.loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
  role: z.enum(["client", "freelancer", "admin"]).default("client")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
