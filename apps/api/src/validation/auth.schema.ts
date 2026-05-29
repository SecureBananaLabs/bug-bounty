  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(['FREELANCER', 'CLIENT']).refine((val) => val !== 'ADMIN', {
    message: 'Admin role cannot be self-assigned during registration",
  }),
});

export const loginSchema = z.object({