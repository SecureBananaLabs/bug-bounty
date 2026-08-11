const authService = require('../src/services/authService');
const db = require('../src/config/db');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../src/config/env');

// Mock the database module
jest.mock('../src/config/db');

// Mock bcrypt to avoid actual hashing
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('authService.registerUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate user id once and sign token with the same id', async () => {
    // Mock Date.now to return different values on consecutive calls
    let callCount = 0;
    const originalDateNow = Date.now;
    Date.now = jest.fn(() => {
      callCount++;
      if (callCount === 1) return 1000;
      if (callCount === 2) return 2000; // Different timestamp to simulate clock advance
      return originalDateNow();
    });

    // Mock db.query to simulate no existing user and successful insert
    db.query.mockImplementation((query, params) => {
      if (query.includes('SELECT')) {
        return Promise.resolve({ rows: [] });
      }
      if (query.includes('INSERT')) {
        return Promise.resolve({ rows: [{ id: 'usr_1000' }] });
      }
      return Promise.resolve({ rows: [] });
    });

    const payload = {
      email: 'test@example.com',
      password: 'password123',
      role: 'user',
      name: 'Test User',
    };

    const result = await authService.registerUser(payload);

    // Verify the returned id is based on the first Date.now call
    expect(result.id).toBe('usr_1000');

    // Decode the token and verify its sub matches the returned id
    const decoded = jwt.verify(result.token, JWT_SECRET);
    expect(decoded.sub).toBe('usr_1000');

    // Restore Date.now
    Date.now = originalDateNow;
  });

  it('should reject registration if user already exists', async () => {
    db.query.mockImplementation((query) => {
      if (query.includes('SELECT')) {
        return Promise.resolve({ rows: [{ id: 'existing_user' }] });
      }
      return Promise.resolve({ rows: [] });
    });

    const payload = {
      email: 'existing@example.com',
      password: 'password123',
      role: 'user',
    };

    await expect(authService.registerUser(payload)).rejects.toThrow('User already exists');
  });

  it('should successfully register a new user and return token', async () => {
    db.query.mockImplementation((query) => {
      if (query.includes('SELECT')) {
        return Promise.resolve({ rows: [] });
      }
      if (query.includes('INSERT')) {
        return Promise.resolve({ rows: [{ id: 'usr_1234567890' }] });
      }
      return Promise.resolve({ rows: [] });
    });

    const payload = {
      email: 'newuser@example.com',
      password: 'securepassword',
      role: 'admin',
      name: 'New User',
    };

    const result = await authService.registerUser(payload);

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('token');
    expect(result.id).toMatch(/^usr_\d+$/);

    const decoded = jwt.verify(result.token, JWT_SECRET);
    expect(decoded.sub).toBe(result.id);
    expect(decoded.role).toBe('admin');
  });
});
