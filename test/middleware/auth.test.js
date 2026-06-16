const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const auth = require('../../src/middleware/auth');
const User = require('../../src/models/User');

const app = express();
app.use(express.json());
app.get('/protected', auth, (req, res) => {
  res.json({ msg: 'Protected route accessed', user: req.user.id });
});

describe('Auth Middleware', () => {
  let user;
  let token;

  beforeAll(async () => {
    user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    await user.save();
    
    token = jwt.sign(
      { user: { id: user.id } },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await User.deleteMany({});
  });

  test('should access protected route with valid token', async () => {
    const res = await request(app)
      .get('/protected')
      .set('x-auth-token', token);
    
    expect(res.status).toBe(200);
    expect(res.body.user).toBe(user.id);
  });

  test('should reject request without token', async () => {
    const res = await request(app)
      .get('/protected');
    
    expect(res.status).toBe(401);
    expect(res.body.msg).toBe('No token, authorization denied');
  });

  test('should reject request with invalid token', async () => {
    const res = await request(app)
      .get('/protected')
      .set('x-auth-token', 'invalid-token');
    
    expect(res.status).toBe(401);
    expect(res.body.msg).toBe('Token is not valid');
  });

  test('should reject request with manipulated token payload', async () => {
    // Create a token with invalid payload structure
    const badToken = jwt.sign(
      { invalid: 'payload' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    const res = await request(app)
      .get('/protected')
      .set('x-auth-token', badToken);
    
    expect(res.status).toBe(401);
    expect(res.body.msg).toBe('Token is not valid');
  });

  test('should reject request with non-existent user ID', async () => {
    const nonExistentToken = jwt.sign(
      { user: { id: '507f1f77bcf86cd799439011' } },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    const res = await request(app)
      .get('/protected')
      .set('x-auth-token', nonExistentToken);
    
    expect(res.status).toBe(401);
    expect(res.body.msg).toBe('User not found');
  });
});