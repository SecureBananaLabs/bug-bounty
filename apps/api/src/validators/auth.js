import { z } from 'zod';

const allowedRoles = ['client', 'freelancer'];

const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    role: z.enum(allowedRoles, {
      errorMap: () => ({ message: 'Role must be either client or freelancer' }),
    }),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});

const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Verification token is required'),
  }),
});

const resendVerificationSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
  }),
});

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    avatar: z.string().url('Avatar must be a valid URL').optional(),
    bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
    skills: z.array(z.string()).optional(),
    hourlyRate: z.number().positive('Hourly rate must be positive').optional(),
    availability: z.enum(['available', 'busy', 'unavailable']).optional(),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  }),
});

export {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  updateProfileSchema,
  changePasswordSchema,
};
