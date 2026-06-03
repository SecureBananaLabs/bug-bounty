const request = require('supertest');
const express = require('express');
const userRoutes = require('../../src/routes/userRoutes');
const userService = require('../../src/services/userService');

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('POST /api/users', () => {
  beforeEach(() => {
    // Clear the in-memory users array
    delete require.cache[require.resolve('../../src/services/userService')];
  });

  it('should create a user and return 201', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com', fullName: 'Test User' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe('test@example.com');
  });

  it('should return 409 for duplicate email', async () => {
    await request(app)
      .post('/api/users')
      .send({ email: 'dup@example.com', fullName: 'First' });

    const res = await request(app)
      .post('/api/users')
      .send({ email: 'dup@example.com', fullName: 'Second' });
    expect(res.statusCode).toBe(409);
    expect(res.body.error).toBe('A user with this email already exists');
  });

  it('should return 400 for missing fields', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ email: 'only@email.com' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Email and fullName are required');
  });
});
