  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    role: z.enum(['CLIENT', 'FREELANCER']).optional(),
  }),
});