import { describe, it, expect } from '@jest/globals';
import { registerSchema } from '../src/schemas/authSchemas';

describe('Registration Schema', () => {
  it('should reject registration without fullName', () => {
    expect(() => {
      registerSchema.parse({
        email: 'test@example.com',
        password: 'password123',
        role: 'CLIENT'
      });
    }).toThrow();
  });

  it('should accept registration with fullName', () => {
    const result = registerSchema.safeParse({
      fullName: 'John Doe',
      email: 'test@example.com',
      password: 'password123',
      role: 'CLIENT'
    });
    expect(result.success).toBe(true);
  });

  it('should preserve valid fullName in returned user payload', () => {
    const userData = {
      fullName: 'Jane Smith',
      email: 'test@example.com',
      password: 'password123',
      role: 'FREELANCER'
    };
    expect(registerSchema.parse(userData)).toEqual(expect.objectContaining({ fullName: 'Jane Smith' }));
  });
});