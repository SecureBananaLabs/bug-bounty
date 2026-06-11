  email: z.string().email(),
  password: z.string().min(6),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Refresh token is required'),
  }),
});