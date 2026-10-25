import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '../validators/auth.js';

describe('auth validator - registerSchema', () => {
  it('should accept valid client registration', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
    expect(result.data.role).toBe('client'); // default
  });

  it('should accept freelancer role', () => {
    const result = registerSchema.safeParse({
      email: 'dev@example.com',
      password: 'securepass123',
      role: 'freelancer',
    });
    expect(result.success).toBe(true);
    expect(result.data.role).toBe('freelancer');
  });

  it('should reject admin role (privilege escalation prevention)', () => {
    const result = registerSchema.safeParse({
      email: 'attacker@example.com',
      password: 'password123',
      role: 'admin', // NOT allowed
    });
    expect(result.success).toBe(false);
  });

  it('should require valid email', () => {
    const result = registerSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('should require password >= 8 chars', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
    });
    expect(result.success).toBe(false);
  });
});

describe('auth validator - loginSchema', () => {
  it('should accept valid login', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });
});
