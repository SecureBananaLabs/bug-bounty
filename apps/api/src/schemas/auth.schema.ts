export const loginSchema = z.object({
  body: loginBodySchema,
});

export const refreshTokenBodySchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export type RefreshTokenBody = z.infer<typeof refreshTokenBodySchema>;