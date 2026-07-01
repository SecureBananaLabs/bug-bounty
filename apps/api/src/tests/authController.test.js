import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { register, login } from '../controllers/authController.js';
import * as authService from '../services/authService.js';

// Mock authService
mock.method(authService, 'registerUser', async () => {
  throw new Error('Service Error: Database failure');
});
mock.method(authService, 'loginUser', async () => {
  throw new Error('Service Error: Authentication failure');
});

describe('authController error handling', () => {
  it('should forward error to next() when registerUser fails', async () => {
    const req = { body: { email: 'test@example.com', password: 'password', role: 'client' } };
    const res = {};
    const next = (err) => {
      assert.strictEqual(err.message, 'Service Error: Database failure');
    };
    
    await register(req, res, next);
  });

  it('should forward error to next() when loginUser fails', async () => {
    const req = { body: { email: 'test@example.com', password: 'password' } };
    const res = {};
    const next = (err) => {
      assert.strictEqual(err.message, 'Service Error: Authentication failure');
    };
    
    await login(req, res, next);
  });
});
