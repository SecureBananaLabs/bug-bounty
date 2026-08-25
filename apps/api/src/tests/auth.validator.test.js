import { test } from 'node:test';
import assert from 'node:assert';
import { registerSchema } from '../validators/auth.js';

test('registerSchema accepts valid roles', () => {
  const clientPayload = { email: 'test@example.com', password: 'password123', role: 'client' };
  const freelancerPayload = { email: 'test@example.com', password: 'password123', role: 'freelancer' };
  
  assert.doesNotThrow(() => registerSchema.parse(clientPayload));
  assert.doesNotThrow(() => registerSchema.parse(freelancerPayload));
});

test('registerSchema rejects admin role', () => {
  const adminPayload = { email: 'test@example.com', password: 'password123', role: 'admin' };
  
  assert.throws(() => registerSchema.parse(adminPayload));
});
