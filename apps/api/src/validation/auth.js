export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1),
  role: z.enum(["CLIENT", "FREELANCER", "ADMIN"]),
});