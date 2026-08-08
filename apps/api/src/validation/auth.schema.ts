export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(['CLIENT', 'FREELANCER']).optional(),
});

export const refreshTokenSchema = z.object({