typescript
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { hash } from 'bcrypt';
import { Logger } from 'winston';
import { injectable, inject } from 'tsyringe';

// Types and Interfaces
export interface RegistrationInput {
  email: string;
  password: string;
  role: 'USER' | 'ADMIN';
  fullName: string;
}

export interface UserWithoutPassword {
  id: string;
  email: string;
  role: string;
  fullName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ValidationResult {
  email: string;
  password: string;
  role: 'USER' | 'ADMIN';
  fullName: string;
}

// Custom Error Classes
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly correlationId?: string;

  constructor(message: string, statusCode: number, correlationId?: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.correlationId = correlationId;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  public readonly errors: z.ZodIssue[];

  constructor(errors: z.ZodIssue[], correlationId?: string) {
    super('Validation failed', 400, correlationId);
    this.name = 'ValidationError';
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class DuplicateResourceError extends AppError {
  constructor(resource: string, identifier: string, correlationId?: string) {
    super(`${resource} with ${identifier} already exists`, 409, correlationId);
    this.name = 'DuplicateResourceError';
    Object.setPrototypeOf(this, DuplicateResourceError.prototype);
  }
}

// Registration Schema with fullName validation
export const registrationSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .transform((email) => email.toLowerCase().trim())
    .refine((email) => email.length > 0, 'Email is required'),
  
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  
  role: z.enum(['USER', 'ADMIN'], {
    errorMap: () => ({ message: 'Role must be either USER or ADMIN' }),
  }),
  
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must not exceed 100 characters')
    .regex(
      /^[a-zA-Z\s'-]+$/,
      'Full name must contain only letters, spaces, hyphens, and apostrophes'
    )
    .transform((name) => name.trim())
    .refine((name) => name.length > 0, 'Full name cannot be only whitespace'),
});

// Validation function
export function validateRegistrationInput(
  input: unknown,
  correlationId?: string
): ValidationResult {
  const result = registrationSchema.safeParse(input);
  
  if (!result.success) {
    throw new ValidationError(result.error.issues, correlationId);
  }
  
  return result.data;
}

// Password hashing function
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return hash(password, saltRounds);
}

// Logger interface for dependency injection
export interface ILogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

// Main service class
@injectable()
export class AuthService {
  constructor(
    @inject('PrismaClient') private prisma: PrismaClient,
    @inject('Logger') private logger: ILogger
  ) {}

  /**
   * Register a new user in the system.
   * 
   * @param input - Registration input containing email, password, role, and fullName
   * @returns Promise resolving to user object without password
   * @throws {ValidationError} If input validation fails
   * @throws {DuplicateResourceError} If email already exists
   * @throws {AppError} For other unexpected errors
   */
  async registerUser(input: RegistrationInput): Promise<UserWithoutPassword> {
    const correlationId = randomUUID();
    
    try {
      this.logger.info('Starting user registration process', {
        correlationId,
        email: input.email,
        role: input.role,
      });

      // Validate input with comprehensive error handling
      const validated = validateRegistrationInput(input, correlationId);

      // Check for existing user with optimized query
      const existingUser = await this.prisma.user.findUnique({
        where: { email: validated.email },
        select: { id: true },
      });

      if (existingUser) {
        this.logger.warn('Registration attempt with existing email', {
          correlationId,
          email: validated.email,
        });
        throw new DuplicateResourceError('User', `email ${validated.email}`, correlationId);
      }

      // Hash password with performance optimization
      this.logger.debug('Hashing password', { correlationId });
      const hashedPassword = await hashPassword(validated.password);

      // Create user with all required fields
      this.logger.debug('Creating user in database', {
        correlationId,
        email: validated.email,
        role: validated.role,
        fullName: validated.fullName,
      });

      const user = await this.prisma.user.create({
        data: {
          email: validated.email,
          password: hashedPassword,
          role: validated.role,
          fullName: validated.fullName,
        },
        select: {
          id: true,
          email: true,
          role: true,
          fullName: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      this.logger.info('User registered successfully', {
        correlationId,
        userId: user.id,
        email: user.email,
      });

      return user;
    } catch (error) {
      // Re-throw known errors
      if (error instanceof AppError) {
        throw error;
      }

      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        this.logger.warn('Registration validation failed', {
          correlationId,
          errors: error.errors,
        });
        throw new ValidationError(error.errors, correlationId);
      }

      // Handle Prisma unique constraint violations
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        this.logger.warn('Duplicate email detected by database', {
          correlationId,
          email: input.email,
        });
        throw new DuplicateResourceError('User', `email ${input.email}`, correlationId);
      }

      // Log and wrap unexpected errors
      this.logger.error('Unexpected error during user registration', {
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw new AppError(
        'Failed to register user. Please try again later.',
        500,
        correlationId
      );
    }
  }
}

// Test file
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthService } from '../services/auth.service';
import { registrationSchema, validateRegistrationInput } from '../schemas/registration.schema';

// Mock logger
const mockLogger: ILogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

// Mock Prisma client
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
};

describe('Registration Schema Validation', () => {
  const validInput: RegistrationInput = {
    email: 'test@example.com',
    password: 'SecurePass123',
    role: 'USER',
    fullName: 'John Doe',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fullName validation', () => {
    it('should reject missing fullName', () => {
      const { email, password, role } = validInput;
      const result = registrationSchema.safeParse({ email, password, role });

      expect(result.success).toBe(false);
      if (!result.success) {
        const fullNameIssue = result.error.issues.find(
          (issue) => issue.path.includes('fullName')
        );
        expect(fullNameIssue).toBeDefined();
        expect(fullNameIssue!.message).toBe('Full name is required');
      }
    });

    it('should reject empty fullName', () => {
      const result = registrationSchema.safeParse({
        ...validInput,
        fullName: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const fullNameIssue = result.error.issues.find(
          (issue) => issue.path.includes('fullName')
        );
        expect(fullNameIssue).toBeDefined();
        expect(fullNameIssue!.message).toBe('Full name is required');
      }
    });

    it('should reject fullName with invalid characters', () => {
      const result = registrationSchema.safeParse({
        ...validInput,
        fullName: 'John123 Doe!',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const fullNameIssue = result.error.issues.find(
          (issue) => issue.path.includes('fullName')
        );
        expect(fullNameIssue).toBeDefined();
        expect(fullNameIssue!.message).toContain('letters');
      }
    });

    it('should reject fullName exceeding max length', () => {
      const result = registrationSchema.safeParse({
        ...validInput,
        fullName: 'A'.repeat(101),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const fullNameIssue = result.error.issues.find(
          (issue) => issue.path.includes('fullName')
        );
        expect(fullNameIssue).toBeDefined();
        expect(fullNameIssue!.message).toContain('100 characters');
      }
    });

    it('should accept valid fullName', () => {
      const result = registrationSchema.safeParse(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fullName).toBe('John Doe');
      }
    });

    it('should trim whitespace from fullName', () => {
      const result = registrationSchema.safeParse({
        ...validInput,
        fullName: '  Jane Smith  ',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fullName).toBe('Jane Smith');
      }
    });

    it('should accept fullName with hyphens and apostrophes', () => {
      const result = registrationSchema.safeParse({
        ...validInput,
        fullName: "Mary-Jane O'Brien",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fullName).toBe("Mary-Jane O'Brien");
      }
    });
  });

  describe('email validation', () => {
    it('should reject invalid email', () => {
      const result = registrationSchema.safeParse({
        ...validInput,
        email: 'invalid-email',
      });

      expect(result.success).toBe(false);
    });

    it('should normalize email to lowercase', () => {
      const result = registrationSchema.safeParse({
        ...validInput,
        email: 'Test@Example.COM',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });
  });

  describe('password validation', () => {
    it('should reject password shorter than 8 characters', () => {
      const result = registrationSchema.safeParse({
        ...validInput,
        password: 'Short1A',
      });

      expect(result.success).toBe(false);
    });

    it('should reject password without uppercase letter', () => {
      const result = registrationSchema.safeParse({
        ...validInput,
        password: 'lowercase1',
      });

      expect(result.success).toBe(false);
    });

    it('should reject password without lowercase letter', () => {
      const result = registrationSchema.safeParse({
        ...validInput,
        password: 'UPPERCASE1',
      });

      expect(result.success).toBe(false);
    });

    it('should reject password without number', () => {
      const result = registrationSchema.safeParse({
        ...validInput,
        password: 'NoNumbers',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('validateRegistrationInput function', () => {
    it('should return validated input for valid data', () => {
      const result = validateRegistrationInput(validInput);
      expect(result).toEqual({
        email: 'test@example.com',
        password: 'SecurePass123',
        role: 'USER',
        fullName: 'John Doe',
      });
    });

    it('should throw ValidationError for invalid data', () => {
      expect(() => validateRegistrationInput({})).toThrow(ValidationError);
    });
  });
});

describe('AuthService', () => {
  let authService: AuthService;

  const validInput: RegistrationInput = {
    email: 'test@example.com',
    password: 'SecurePass123',
    role: 'USER',
    fullName: 'John Doe',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService(mockPrisma as any, mockLogger);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('registerUser', () => {
    it('should successfully register a user with fullName', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'USER',
        fullName: 'John Doe',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await authService.registerUser(validInput);

      expect(result).toEqual(mockUser);
      expect(result.fullName).toBe('John Doe');
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fullName: 'John Doe',
          email: 'test@example.com',
          role: 'USER',
        }),
        select: expect.any(Object),
      });
    });

    it('should reject registration with missing fullName', async () => {
      const invalidInput = {
        email: 'test@example.com',
        password: 'SecurePass123',
        role: 'USER',
      };

      await expect(authService.registerUser(invalidInput as RegistrationInput)).rejects.toThrow(
        ValidationError
      );
    });

    it('should reject registration with empty fullName', async () => {
      const invalidInput = {
        ...validInput,
        fullName: '',
      };

      await expect(authService.registerUser(invalidInput)).rejects.toThrow(
        ValidationError
      );
    });

    it('should reject duplicate email registration', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      await expect(authService.registerUser(validInput)).rejects.toThrow(
        DuplicateResourceError
      );
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      await expect(authService.registerUser(validInput)).rejects.toThrow(AppError);
    });
  });
});