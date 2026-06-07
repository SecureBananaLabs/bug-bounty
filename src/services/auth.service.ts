typescript
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { getPrismaClient } from '../lib/prisma';
import { logger } from '../lib/logger';
import { 
  ValidationError, 
  UserAlreadyExistsError, 
  DatabaseError 
} from '../lib/errors';

/**
 * Registration input schema with fullName validation
 */
export const registerSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(255, 'Email must be less than 255 characters')
    .transform((email) => email.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must contain uppercase, lowercase, number and special character'
    ),
  role: z
    .enum(['USER', 'ADMIN', 'MODERATOR'], {
      errorMap: () => ({ message: 'Role must be USER, ADMIN, or MODERATOR' })
    })
    .default('USER'),
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be less than 100 characters')
    .regex(
      /^[a-zA-Z\s'-]+$/,
      'Full name can only contain letters, spaces, hyphens and apostrophes'
    )
    .transform((name) => name.trim().replace(/\s+/g, ' '))
});

/**
 * Type definitions for registration flow
 */
export type RegisterInput = z.infer<typeof registerSchema>;

export interface UserPayload {
  id: string;
  email: string;
  role: string;
  fullName: string;
  createdAt: Date;
}

export interface RegistrationResult {
  success: boolean;
  data?: UserPayload;
  error?: string;
  errorCode?: 'VALIDATION_ERROR' | 'USER_EXISTS' | 'DATABASE_ERROR' | 'UNKNOWN_ERROR';
}

const DB_TIMEOUT_MS = 5000;
const BCRYPT_SALT_ROUNDS = 12;
const HASH_WARNING_THRESHOLD_MS = 1000;

/**
 * Registers a new user with comprehensive validation and error handling.
 * 
 * @param input - The registration input data containing email, password, role, and fullName
 * @returns A promise that resolves to the created user payload
 * @throws {ValidationError} If input validation fails
 * @throws {UserAlreadyExistsError} If user with email already exists
 * @throws {DatabaseError} If database operations fail
 */
export async function registerUser(input: RegisterInput): Promise<UserPayload> {
  const startTime = Date.now();
  const prismaClient = getPrismaClient();

  try {
    // Validate input with detailed error handling
    let validatedInput: RegisterInput;
    try {
      validatedInput = registerSchema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationMessage = error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        logger.warn('Registration validation failed', {
          errors: error.errors,
          input: { email: input.email, fullName: input.fullName }
        });
        throw new ValidationError(validationMessage);
      }
      throw error;
    }

    // Check if user already exists with timeout
    let existingUser;
    try {
      existingUser = await Promise.race([
        prismaClient.user.findUnique({
          where: { email: validatedInput.email },
          select: { id: true }
        }),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), DB_TIMEOUT_MS)
        )
      ]);
    } catch (error) {
      logger.error('Failed to check existing user', {
        error,
        email: validatedInput.email
      });
      throw new DatabaseError('Failed to check user existence', error);
    }

    if (existingUser) {
      logger.warn('Duplicate registration attempt', {
        email: validatedInput.email
      });
      throw new UserAlreadyExistsError(validatedInput.email);
    }

    // Hash password with cost factor monitoring
    let hashedPassword: string;
    try {
      const hashStartTime = Date.now();
      hashedPassword = await bcrypt.hash(validatedInput.password, BCRYPT_SALT_ROUNDS);
      const hashDuration = Date.now() - hashStartTime;
      
      if (hashDuration > HASH_WARNING_THRESHOLD_MS) {
        logger.warn('Password hashing took longer than expected', {
          duration: hashDuration
        });
      }
    } catch (error) {
      logger.error('Password hashing failed', { error });
      throw new DatabaseError('Failed to hash password', error);
    }

    // Create user with transaction for data consistency
    let user: UserPayload;
    try {
      user = await prismaClient.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            email: validatedInput.email,
            password: hashedPassword,
            role: validatedInput.role,
            fullName: validatedInput.fullName,
          },
          select: {
            id: true,
            email: true,
            role: true,
            fullName: true,
            createdAt: true,
          },
        });

        // Log successful registration
        logger.info('User registered successfully', {
          userId: createdUser.id,
          email: createdUser.email,
          role: createdUser.role,
          fullName: createdUser.fullName,
          duration: Date.now() - startTime
        });

        return createdUser;
      });
    } catch (error) {
      logger.error('Failed to create user in database', {
        error,
        email: validatedInput.email
      });
      throw new DatabaseError('Failed to create user', error);
    }

    return user;

  } catch (error) {
    // Re-throw known errors
    if (error instanceof ValidationError || 
        error instanceof UserAlreadyExistsError || 
        error instanceof DatabaseError) {
      throw error;
    }

    // Log and wrap unknown errors
    logger.error('Unexpected error during user registration', {
      error,
      input: { email: input.email }
    });
    throw new DatabaseError('An unexpected error occurred during registration', error);
  }
}

/**
 * Safe version of registerUser that returns a result object instead of throwing.
 * Useful for API handlers that want to avoid try-catch blocks.
 * 
 * @param input - The registration input data
 * @returns A promise that resolves to a RegistrationResult object
 */
export async function registerUserSafe(input: RegisterInput): Promise<RegistrationResult> {
  try {
    const user = await registerUser(input);
    return {
      success: true,
      data: user
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        success: false,
        error: error.message,
        errorCode: 'VALIDATION_ERROR'
      };
    }
    if (error instanceof UserAlreadyExistsError) {
      return {
        success: false,
        error: error.message,
        errorCode: 'USER_EXISTS'
      };
    }
    if (error instanceof DatabaseError) {
      return {
        success: false,
        error: 'Database operation failed',
        errorCode: 'DATABASE_ERROR'
      };
    }
    return {
      success: false,
      error: 'An unexpected error occurred',
      errorCode: 'UNKNOWN_ERROR'
    };
  }
}

/**
 * Validates registration input without performing the registration.
 * Useful for client-side validation or preview.
 * 
 * @param input - Partial registration input to validate
 * @returns An object containing validation result and any errors
 */
export function validateRegistrationInput(input: Partial<RegisterInput>): {
  valid: boolean;
  errors: Record<string, string[]>;
} {
  const result = registerSchema.safeParse(input);
  
  if (result.success) {
    return { valid: true, errors: {} };
  }

  const errors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }

  return { valid: false, errors };
}

// Export schema and types for testing and external use
export { registerSchema };
export type { RegisterInput, UserPayload, RegistrationResult };