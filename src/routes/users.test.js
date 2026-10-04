<content>
const request = require('supertest');
const app = require('../app');
const usersRouter = require('./users');

// Mock the in-memory user store
let users = [];

beforeAll(() => {
  // Replace the users router in the app with our test version
  app.use('/api/users', usersRouter);
});

beforeEach(() => {
  users = [];
});

describe('POST /api/users', () => {
  it('should create a user with valid data', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'test@example.com',
        role: 'freelancer'
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: 1,
      email: 'test@example.com',
      role: 'freelancer'
    });
  });

  it('should reject request with invalid email', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'invalid-email',
        role: 'freelancer'
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual({
      msg: 'Email must be a valid email address',
      param: 'email',
      location: 'body'
    });
  });

  it('should reject request with invalid role', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'test@example.com',
        role: 'invalid-role'
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual({
      msg: 'Role must be either freelancer or client',
      param: 'role',
      location: 'body'
    });
  });

  it('should reject request with missing email', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        role: 'freelancer'
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual({
      msg: 'Invalid value',
      param: 'email',
      location: 'body'
    });
  });

  it('should reject request with missing role', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'test@example.com'
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual({
      msg: 'Invalid value',
      param: 'role',
      location: 'body'
    });
  });
});
</content>