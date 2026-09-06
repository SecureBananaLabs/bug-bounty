import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { passwordComplexitySchema } from '../validators/auth.js';

describe('Password Complexity Validator', () => {
  it('accepts strong passwords meeting all complexity criteria', () => {
    assert.equal(passwordComplexitySchema.parse('SecurePass123!'), 'SecurePass123!');
    assert.equal(passwordComplexitySchema.parse('C0mplex#Key99'), 'C0mplex#Key99');
  });

  it('rejects passwords shorter than 8 characters', () => {
    assert.throws(() => passwordComplexitySchema.parse('P1!a'));
  });

  it('rejects passwords without uppercase letters', () => {
    assert.throws(() => passwordComplexitySchema.parse('password123!'));
  });

  it('rejects passwords without digits', () => {
    assert.throws(() => passwordComplexitySchema.parse('PasswordOnly!'));
  });

  it('rejects passwords without special characters', () => {
    assert.throws(() => passwordComplexitySchema.parse('Password12345'));
  });
});
