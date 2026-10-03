<content>
const request = require('supertest');
const app = require('../app');
const { User } = require('../src/models');
const bcrypt = require('bcrypt');

describe('POST /api/auth/login', () => {
  let user;

  beforeEach(async () => {
    // Create a test user with a known password hash
    const password = 'testpassword123';
    const passwordHash = await bcrypt.hash(password, 10);
    
    user = await User.create({
      email: 'test@example.com',
      passwordHash,
      role: 'client',
    });
  });

  afterEach(async () => {
    // Clean up test data
    await User.destroy({ where: {} });
  });

  it('should return a token for valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testpassword123',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(typeof response.body.token).toBe('string');
  });

  it('should return 401 for unknown email', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'unknown@example.com',
        password: 'testpassword123',
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Invalid credentials');
  });

  it('should return 401 for wrong password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Invalid credentials');
  });

  it('should return 400 when email or password is missing', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Email and password are required');
  });
});
</content>