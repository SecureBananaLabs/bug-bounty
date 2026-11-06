import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["client", "freelancer", "admin"]).default("client")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const oauthCallbackParamsSchema = z.object({
  provider: z.enum(["google", "github", "discord", "apple"], {
    errorMap: () => ({ message: "Unsupported OAuth provider" })
  })
});
