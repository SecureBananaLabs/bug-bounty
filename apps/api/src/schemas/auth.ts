  email: z.string().email(),
  password: z.string().min(6),
});

export const RefreshTokenSchema = z.object({
  token: z.string().min(1),
});