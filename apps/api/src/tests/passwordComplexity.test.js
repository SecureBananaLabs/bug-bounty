const { passwordComplexitySchema } = require('../validators/auth');

describe('passwordComplexitySchema', () => {
  test('should accept a valid strong password', () => {
    expect(passwordComplexitySchema.parse('StrongPass1!')).toBe('StrongPass1!');
  });

  test('should reject passwords shorter than 8 characters', () => {
    expect(passwordComplexitySchema.safeParse('Ab1!').success).toBe(false);
    expect(passwordComplexitySchema.safeParse('Ab1!').error.errors[0].message).toBe('Password must be at least 8 characters long');
  });

  test('should reject passwords without a digit', () => {
    expect(passwordComplexitySchema.safeParse('StrongPass!').success).toBe(false);
    expect(passwordComplexitySchema.safeParse('StrongPass!').error.errors[0].message).toBe('Password must contain at least one digit');
  });

  test('should reject passwords without an uppercase letter', () => {
    expect(passwordComplexitySchema.safeParse('strongpass1!').success).toBe(false);
    expect(passwordComplexitySchema.safeParse('strongpass1!').error.errors[0].message).toBe('Password must contain at least one uppercase letter');
  });

  test('should reject passwords without a special character', () => {
    expect(passwordComplexitySchema.safeParse('StrongPass1').success).toBe(false);
    expect(passwordComplexitySchema.safeParse('StrongPass1').error.errors[0].message).toBe('Password must contain at least one special character');
  });
});