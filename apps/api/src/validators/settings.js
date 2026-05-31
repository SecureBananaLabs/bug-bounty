import { z } from "zod";

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8, "Current password must be at least 8 characters"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New password and confirmation do not match",
  path: ["confirmPassword"],
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100).optional(),
  email: z.string().email("Invalid email address").optional(),
  bio: z.string().max(500, "Bio must be 500 characters or less").optional(),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(8, "Password confirmation is required"),
});
