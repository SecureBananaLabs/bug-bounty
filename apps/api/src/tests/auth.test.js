const request = require('supertest');
const app = require('../app');
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

// Mock database
jest.mock('../config/db', () => ({
  query: jest.fn()
}));

// Mock uuid to return predictable id
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-user-id-123')
}));

describe('Auth Service - Registration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return user id that matches JWT subject', async () => {
    const mockUser = {
      id: 'test-user-id-123',
      email: 'test@example.com',
      role: 'freelancer',
      created_at: new Date().toISOString()
    };

    db.query.mockResolvedValue({ rows: [mockUser] });

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        role: 'freelancer'
      });

    expect(response.status).toBe(201);
    expect(response.body.user.id).toBe('test-user-id-123');

    // Decode the token and verify sub matches returned id
    const decoded = jwt.verify(response.body.token, env.JWT_SECRET);
    expect(decoded.sub).toBe('test-user-id-123');
    expect(decoded.sub).toBe(response.body.user.id);
  });

  test('should fail with duplicate email', async () => {
    db.query.mockRejectedValue({ code: '23505' }); // unique violation

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'existing@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Email already exists');
  });

  test('should fail with missing fields', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Email and password are required');
  });
});
